FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Pastikan akhir baris LF (file yang dicopy dari Windows bisa CRLF dan membuat script gagal jalan).
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
