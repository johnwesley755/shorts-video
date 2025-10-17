# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the backend and frontend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy the backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend static files from the previous stage
COPY --from=frontend-build /app/dist /app/static

# Copy the FastAPI backend code
COPY backend/ /app/backend/

# Create necessary directories with proper permissions
RUN mkdir -p /app/backend/storage/temp /app/backend/storage/videos /app/backend/storage/videos/metadata /app/backend/storage/images /app/backend/storage/audio \
    && mkdir -p /.cache/huggingface/hub \
    && chmod -R 777 /app/backend/storage /.cache

# Set the working directory to the backend folder
WORKDIR /app/backend

# Expose the port where the FastAPI server will run
EXPOSE 7860

# Set environment variables for better performance
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/.cache/huggingface/hub
ENV HF_HOME=/.cache/huggingface
ENV TORCH_HOME=/.cache/torch
ENV XDG_CACHE_HOME=/.cache

# Command to run the application with Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]





