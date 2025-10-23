# ========================================
# Amazon Review Intelligence - Optimized Dockerfile for Fly.io
# Multi-stage build for minimal image size and fast deployment
# ========================================

# ========================================
# Stage 1: Builder - Install dependencies
# ========================================
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create virtual environment and install Python dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Download NLTK data (required for NLP processing)
RUN python -c "import nltk; \
    nltk.download('punkt', quiet=True); \
    nltk.download('punkt_tab', quiet=True); \
    nltk.download('stopwords', quiet=True); \
    nltk.download('averaged_perceptron_tagger', quiet=True); \
    nltk.download('vader_lexicon', quiet=True); \
    print('✅ NLTK data downloaded')"

# ========================================
# Stage 2: Runtime - Create minimal production image
# ========================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000 \
    HOST=0.0.0.0

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

# Set NLTK data path
ENV NLTK_DATA=/home/appuser/nltk_data

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port (Fly.io will map this internally)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()" || exit 1

# Start the application
# Fly.io sets PORT env variable, so we use it
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2 --log-level info
