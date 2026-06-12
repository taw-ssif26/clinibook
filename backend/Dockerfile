FROM python:3.11-slim

WORKDIR /app

# ... previous lines ...
COPY entrypoint.sh .
# Use the entrypoint as the command
CMD ["./entrypoint.sh"]

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
