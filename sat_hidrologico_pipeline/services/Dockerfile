FROM python:3.11-slim

WORKDIR /app

COPY services/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY services/api_status.py /app/services/api_status.py

EXPOSE 8000

CMD ["uvicorn", "services.api_status:app", "--host", "0.0.0.0", "--port", "8000"]
