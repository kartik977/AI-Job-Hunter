FROM python:3.12-slim-bookworm

# LibreOffice powers PDF previews; Carlito matches Calibri's metrics.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer fonts-crosextra-carlito fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

RUN useradd --create-home --uid 10001 resumeuser
USER resumeuser

ENV PYTHONUNBUFFERED=1
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers"]
