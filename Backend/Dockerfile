FROM python:3.11-slim

WORKDIR /backend

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

EXPOSE 8000

# Set a default port in case $PORT isn't provided by the environment
ENV PORT=8000

# Run uvicorn using the Exec form. 
# It will use the $PORT environment variable automatically.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
