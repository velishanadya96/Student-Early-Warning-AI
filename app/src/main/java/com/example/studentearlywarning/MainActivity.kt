
package com.example.studentearlywarning

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    companion object {
        // Emulator -> "http://10.0.2.2:3000"A
        // HP asli -> "http://IP-LAPTOP:3000"
        // Deploy -> "https://domain-kamu.com"
        const val BASE_URL = "http://10.0.2.2:3000"
        const val START_URL = "$BASE_URL/login"
        const val TAG = "SEW_WEB"
    }

    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar
    private lateinit var errorView: View

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooser =
        registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val uris = WebChromeClient.FileChooserParams.parseResult(
                result.resultCode,
                result.data
            )
            filePathCallback?.onReceiveValue(uris)
            filePathCallback = null
        }

    private val blobPatch = """
        (function() {
          if (window.__sewPatched) return;
          window.__sewPatched = true;
          window.__blobs = {};

          var create = URL.createObjectURL;
          URL.createObjectURL = function(b) {
            var u = create.call(URL, b);
            window.__blobs[u] = b;
            return u;
          };

          var click = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function() {
            if (
              this.download &&
              this.href.indexOf('blob:') === 0 &&
              window.__blobs[this.href]
            ) {
              var blob = window.__blobs[this.href];
              var name = this.download;
              var reader = new FileReader();

              reader.onloadend = function() {
                AndroidBridge.saveFile(
                  String(reader.result).split(',')[1],
                  blob.type || '',
                  name
                );
              };

              reader.readAsDataURL(blob);
              return;
            }

            return click.apply(this, arguments);
          };
        })();
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Membantu layout menyesuaikan ukuran ketika keyboard muncul.
        window.setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        )

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progress = findViewById(R.id.progress)
        errorView = findViewById(R.id.errorView)

        findViewById<Button>(R.id.retryButton)
            .setOnClickListener {
                reload()
            }

        ViewCompat.setOnApplyWindowInsetsListener(
            findViewById(R.id.root)
        ) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or
                        WindowInsetsCompat.Type.ime()
            )

            v.setPadding(
                bars.left,
                bars.top,
                bars.right,
                bars.bottom
            )

            insets
        }

        setupWebView()

        WebView.setWebContentsDebuggingEnabled(true)

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        )

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            setSupportZoom(false)

            mixedContentMode =
                WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        // Mengaktifkan fokus WebView untuk menerima interaksi.
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true
        webView.requestFocus()

        CookieManager.getInstance().setAcceptCookie(true)

        webView.addJavascriptInterface(
            Bridge(),
            "AndroidBridge"
        )

        webView.webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val uri = request.url

                val sameSite =
                    (uri.scheme == "http" || uri.scheme == "https") &&
                            uri.host == Uri.parse(BASE_URL).host

                if (sameSite) return false

                openExternal(uri)
                return true
            }

            override fun onPageStarted(
                view: WebView,
                url: String?,
                favicon: Bitmap?
            ) {
                errorView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onPageFinished(
                view: WebView,
                url: String?
            ) {
                Log.e(TAG, "PAGE FINISHED: $url")
                view.evaluateJavascript(blobPatch, null)
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                Log.e(
                    TAG,
                    "ERROR ${request.url} -> ${error.description}"
                )

                if (request.isForMainFrame) {
                    webView.visibility = View.INVISIBLE
                    errorView.visibility = View.VISIBLE
                }
            }

            override fun onReceivedHttpError(
                view: WebView,
                request: WebResourceRequest,
                errorResponse: WebResourceResponse
            ) {
                Log.e(
                    TAG,
                    "HTTP ${errorResponse.statusCode} ${request.url}"
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {

            override fun onConsoleMessage(
                m: ConsoleMessage
            ): Boolean {
                Log.e(
                    TAG,
                    "JS: ${m.message()} (${m.sourceId()}:${m.lineNumber()})"
                )
                return true
            }

            override fun onProgressChanged(
                view: WebView,
                newProgress: Int
            ) {
                progress.progress = newProgress

                progress.visibility =
                    if (newProgress in 1..99) {
                        View.VISIBLE
                    } else {
                        View.GONE
                    }
            }

            override fun onShowFileChooser(
                webView: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback

                return try {
                    fileChooser.launch(params.createIntent())
                    true
                } catch (e: ActivityNotFoundException) {
                    filePathCallback = null
                    false
                }
            }
        }

        webView.setDownloadListener {
                url,
                userAgent,
                contentDisposition,
                mimeType,
                _ ->

            val fileName = URLUtil.guessFileName(
                url,
                contentDisposition,
                mimeType
            )

            val request = DownloadManager.Request(
                Uri.parse(url)
            ).apply {
                addRequestHeader(
                    "Cookie",
                    CookieManager.getInstance().getCookie(url) ?: ""
                )
                addRequestHeader("User-Agent", userAgent)
                setMimeType(mimeType)
                setTitle(fileName)

                setNotificationVisibility(
                    DownloadManager.Request
                        .VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                )

                setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    fileName
                )
            }

            (
                    getSystemService(Context.DOWNLOAD_SERVICE)
                            as DownloadManager
                    ).enqueue(request)

            Toast.makeText(
                this,
                "Mengunduh $fileName…",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    inner class Bridge {

        @JavascriptInterface
        fun saveFile(
            base64: String,
            mime: String,
            name: String
        ) {
            try {
                val bytes = Base64.decode(
                    base64,
                    Base64.DEFAULT
                )

                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, name)
                    put(
                        MediaStore.Downloads.MIME_TYPE,
                        mime.ifBlank {
                            "application/octet-stream"
                        }
                    )
                    put(
                        MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS
                    )
                }

                val uri = contentResolver.insert(
                    MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                    values
                ) ?: throw IllegalStateException(
                    "Gagal membuat file"
                )

                contentResolver.openOutputStream(uri)?.use {
                    it.write(bytes)
                }

                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "$name tersimpan di folder Download",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Gagal menyimpan file", e)

                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Gagal menyimpan file",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, uri)
            )
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(
                this,
                "Tidak ada aplikasi untuk membuka tautan ini",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun reload() {
        if (webView.url == null) {
            webView.loadUrl(START_URL)
        } else {
            webView.reload()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
