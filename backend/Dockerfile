FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh && useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
# 1 worker + thread: rate limit memori akurat. Untuk beberapa worker, pakai Redis (RATELIMIT_STORAGE_URI).
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "run:app"]
