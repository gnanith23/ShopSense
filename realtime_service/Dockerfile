FROM python:3.11-slim

WORKDIR /app

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Copy dependency list first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy realtime service application files
COPY . .

# Expose FastAPI and WebSocket port
EXPOSE 8000

# Run FastAPI app with Uvicorn on 0.0.0.0:8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
