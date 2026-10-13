// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import VerifyEmailPanel from "@/components/auth/VerifyEmailPanel";
import { useDialog } from "@/hooks/useDialog";
import { ApiRequestError } from "@/lib/authClient";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh, replace: vi.fn() }) }));

const api = vi.hoisted(() => ({
  login: vi.fn(),
  registerStudent: vi.fn(),
  resendVerification: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
}));
vi.mock("@/lib/authClient", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/authClient")>()), ...api }));

function wrap(ui: React.ReactElement) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("LoginForm", () => {
  it("menolak email di luar domain SSO untuk role internal tanpa memanggil API", async () => {
    wrap(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email SSO"), "orang@gmail.com");
    await userEvent.type(screen.getByLabelText("Password"), "rahasia123");
    await userEvent.click(screen.getByRole("button", { name: /Masuk sebagai/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("email SSO");
    expect(api.login).not.toHaveBeenCalled();
  });

  it("login berhasil mengirim role terpilih dan membuka dashboard role itu", async () => {
    api.login.mockResolvedValue({ id: 1, role: "mahasiswa", name: "Alya", email: "alya@student.uns.ac.id", nim: "2024001", username: "alya", is_active: true });
    wrap(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email SSO"), "Alya@Student.uns.ac.id");
    await userEvent.type(screen.getByLabelText("Password"), "rahasia123");
    await userEvent.click(screen.getByRole("button", { name: /Masuk sebagai Mahasiswa/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard-mahasiswa"));
    expect(api.login).toHaveBeenCalledWith({ email: "alya@student.uns.ac.id", password: "rahasia123", role: "mahasiswa" });
  });

  it("email belum diverifikasi: pesan error + tombol kirim ulang yang memanggil API", async () => {
    api.login.mockRejectedValue(new ApiRequestError("Email belum diverifikasi.", 403, "EMAIL_BELUM_TERVERIFIKASI"));
    api.resendVerification.mockResolvedValue("Tautan baru sudah dikirim.");
    wrap(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Email SSO"), "tata@student.uns.ac.id");
    await userEvent.type(screen.getByLabelText("Password"), "rahasia123");
    await userEvent.click(screen.getByRole("button", { name: /Masuk sebagai/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Kirim ulang verifikasi" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Tautan baru sudah dikirim.");
    expect(api.resendVerification).toHaveBeenCalledWith("tata@student.uns.ac.id");
    expect(push).not.toHaveBeenCalled();
  });

  it("menampilkan tautan lupa password", () => {
    wrap(<LoginForm />);
    expect(screen.getByRole("link", { name: "Lupa password?" })).toHaveAttribute("href", "/forgot-password");
  });
});

describe("LoginForm mode demo", () => {
  it("tanpa mode demo, dropdown akun demo tidak tampil", () => {
    wrap(<LoginForm demo={null} />);
    expect(screen.queryByLabelText(/Akun demo/)).toBeNull();
  });

  it("mode demo dengan password: memilih akun mengisi email, jenis akun, dan password seed", async () => {
    wrap(<LoginForm demo={{ password: "DemoUji2026" }} />);
    await userEvent.selectOptions(screen.getByLabelText(/Akun demo/), "dosen@student.uns.ac.id");
    expect(screen.getByLabelText("Email SSO")).toHaveValue("dosen@student.uns.ac.id");
    expect(screen.getByLabelText("Password")).toHaveValue("DemoUji2026");
    expect(screen.getByLabelText("Jenis akun")).toHaveValue("dosen");
  });

  it("mode demo tanpa password: password dikosongkan dan ada petunjuk", async () => {
    wrap(<LoginForm demo={{}} />);
    await userEvent.selectOptions(screen.getByLabelText(/Akun demo/), "orangtua@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("Jenis akun")).toHaveValue("orangtua");
    expect(screen.getByText(/SEED_PASSWORD/)).toBeTruthy();
  });
});

describe("RegisterForm", () => {
  async function fill(overrides: Partial<Record<string, string>> = {}) {
    const v = { "Nama lengkap": "Tata Meirzha", NIM: "2024006", "Email SSO": "tata@student.uns.ac.id", "Password SSO": "Rahasia-123", "Konfirmasi password": "Rahasia-123", ...overrides };
    for (const [label, value] of Object.entries(v)) await userEvent.type(screen.getByLabelText(label), value as string);
    await userEvent.click(screen.getByRole("button", { name: "Daftar akun" }));
  }

  it("validasi: NIM harus angka, password harus cocok", async () => {
    render(<RegisterForm />);
    await fill({ NIM: "abc123" });
    expect(await screen.findByRole("alert")).toHaveTextContent("NIM");
    expect(api.registerStudent).not.toHaveBeenCalled();
    cleanup();
    render(<RegisterForm />);
    await fill({ "Konfirmasi password": "Beda-12345" });
    expect(await screen.findByRole("alert")).toHaveTextContent("Konfirmasi password");
  });

  it("sukses dengan verifikasi email: menampilkan instruksi cek email dan tidak pindah halaman", async () => {
    api.registerStudent.mockResolvedValue({ verification_required: true });
    render(<RegisterForm />);
    await fill();
    expect(await screen.findByRole("status")).toHaveTextContent("tautan verifikasi");
    expect(api.registerStudent).toHaveBeenCalledWith({ name: "Tata Meirzha", email: "tata@student.uns.ac.id", password: "Rahasia-123", nim: "2024006" });
    await new Promise((r) => setTimeout(r, 1100));
    expect(push).not.toHaveBeenCalled();
  });

  it("menampilkan pesan error dari server (mis. NIM sudah dipakai)", async () => {
    api.registerStudent.mockRejectedValue(new ApiRequestError("NIM sudah terdaftar.", 409, "NIM_SUDAH_ADA"));
    render(<RegisterForm />);
    await fill();
    expect(await screen.findByRole("alert")).toHaveTextContent("NIM sudah terdaftar.");
  });
});

describe("lupa dan reset password", () => {
  it("lupa password menampilkan jawaban server", async () => {
    api.forgotPassword.mockResolvedValue("Jika email terdaftar, tautan reset password sudah dikirim.");
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText("Email akun"), "alya@student.uns.ac.id");
    await userEvent.click(screen.getByRole("button", { name: "Kirim tautan reset" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Jika email terdaftar");
  });

  it("reset: validasi lalu kirim token dan password baru", async () => {
    api.resetPassword.mockResolvedValue(undefined);
    render(<ResetPasswordForm token="tok123" />);
    await userEvent.type(screen.getByLabelText("Password baru"), "Password-Baru-9");
    await userEvent.type(screen.getByLabelText("Konfirmasi password baru"), "Beda-sekali-1");
    await userEvent.click(screen.getByRole("button", { name: "Simpan password baru" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Konfirmasi password");
    await userEvent.clear(screen.getByLabelText("Konfirmasi password baru"));
    await userEvent.type(screen.getByLabelText("Konfirmasi password baru"), "Password-Baru-9");
    await userEvent.click(screen.getByRole("button", { name: "Simpan password baru" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Password berhasil diganti");
    expect(api.resetPassword).toHaveBeenCalledWith("tok123", "Password-Baru-9");
  });

  it("reset tanpa token menampilkan pesan, bukan form", () => {
    render(<ResetPasswordForm token="" />);
    expect(screen.getByRole("alert")).toHaveTextContent("tidak lengkap");
    expect(screen.queryByLabelText("Password baru")).toBeNull();
  });
});

describe("VerifyEmailPanel", () => {
  it("memverifikasi sekali dan menampilkan sukses", async () => {
    api.verifyEmail.mockResolvedValue(undefined);
    render(<VerifyEmailPanel token="abc" />);
    expect(await screen.findByText("Email berhasil diverifikasi.")).toBeTruthy();
    expect(api.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it("token ditolak: menampilkan alasan dari server", async () => {
    api.verifyEmail.mockRejectedValue(new ApiRequestError("Tautan verifikasi sudah kedaluwarsa.", 400, "TOKEN_KEDALUWARSA"));
    render(<VerifyEmailPanel token="abc" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("kedaluwarsa");
  });

  it("tanpa token tidak memanggil API", () => {
    render(<VerifyEmailPanel token="" />);
    expect(screen.getByRole("alert")).toHaveTextContent("tidak lengkap");
    expect(api.verifyEmail).not.toHaveBeenCalled();
  });
});

describe("useDialog", () => {
  function Demo({ onClose }: { onClose: () => void }) {
    const ref = useDialog<HTMLDivElement>(onClose);
    return (
      <div>
        <button type="button">pemicu</button>
        <div ref={ref} role="dialog">
          <input aria-label="satu" />
          <button type="button">dua</button>
        </div>
      </div>
    );
  }

  it("fokus masuk ke dialog, Tab berputar, dan Esc menutup", async () => {
    const onClose = vi.fn();
    render(<Demo onClose={onClose} />);
    expect(screen.getByLabelText("satu")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "dua" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByLabelText("satu")).toHaveFocus(); // berputar, tidak keluar dialog
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "dua" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
