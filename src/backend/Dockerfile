FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY host ./host
COPY shared ./shared
COPY modules ./modules
RUN useradd --system app
USER app
EXPOSE 8000
CMD ["uvicorn", "host.main:app", "--host", "0.0.0.0", "--port", "8000"]
