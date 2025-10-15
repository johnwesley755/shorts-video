from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from routes.video_routes import video_router
from config import Config

app = FastAPI(title="Shorts Video API")

# Define the list of allowed origins (frontends)
origins = [
    "https://shorts-video-six.vercel.app/",  # Your frontend URL
    "http://localhost:3000",                  # For local development
    "http://localhost:5173",                  # For local development (e.g., Vite)
]

# Configure CORS with the specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(video_router, prefix="/api/videos")

# Add the new root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Shorts Video API"}

# Basic error handling
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found"}
    )

@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# Create storage directories on startup
@app.on_event("startup")
async def startup_event():
    os.makedirs(Config.TEMP_DIR, exist_ok=True)
    os.makedirs(Config.VIDEOS_DIR, exist_ok=True)
    os.makedirs(Config.IMAGES_DIR, exist_ok=True)
    os.makedirs(Config.AUDIO_DIR, exist_ok=True)

if __name__ == '__main__':
    import uvicorn
    # Use environment variables for port if available (for Render deployment)
    port = int(os.environ.get('PORT', Config.PORT))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=Config.DEBUG)
