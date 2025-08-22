# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Copy project files
COPY pyproject.toml .
COPY . .

# Create virtual environment and install dependencies
RUN uv venv && \
    . .venv/bin/activate && \
    uv pip install -e .

# Create tmp directory for database files
RUN mkdir -p tmp

# Expose port
EXPOSE 8082

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/.venv/bin:$PATH"

# Run the application
CMD ["python", "main.py"]