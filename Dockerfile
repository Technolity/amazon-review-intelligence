# ========================================
# Amazon Review Intelligence - Backend Dockerfile
# Multi-stage build for optimal size and security
# ========================================

# ========================================
# Stage 1: Builder - Install dependencies
# ========================================
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY backend/requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('vader_lexicon', quiet=True)"

# ========================================
# Stage 2: Runtime - Create final image
# ========================================
FROM python:3.11-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=10000 \
    NLTK_DATA=/home/appuser/nltk_data

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/data /app/exports /app/logs && \
    chown -R appuser:appuser /app

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy NLTK data from builder
COPY --from=builder /root/nltk_data /home/appuser/nltk_data

# Copy backend application code
COPY --chown=appuser:appuser backend/ .

# Switch to non-root user
USER appuser

# Expose port (use Render's default PORT)
EXPOSE 10000

# Health check (use the actual PORT)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Run the application - FIXED IMPORT PATH
# Option A: If your main.py is directly in the backend folder
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000", "--workers", "2"]

# OR Option B: If you want to use the PORT environment variable
# CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2"]