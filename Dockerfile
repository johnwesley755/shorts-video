# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build --emptyOutDir

# Stage 2: Serve the backend and frontend
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend static files from the previous stage
COPY --from=frontend-build /app/dist ./static

# Copy the FastAPI backend code
COPY backend/ ./backend

# Expose the port where the FastAPI server will run
EXPOSE 7860

# Command to run the application with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
