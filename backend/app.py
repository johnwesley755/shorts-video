from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import pathlib
from contextlib import asynccontextmanager
from routes.video_routes import video_router
from config import Config

# Create the lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up... Creating storage directories.")
    os.makedirs(Config.TEMP_DIR, exist_ok=True)
    os.makedirs(Config.VIDEOS_DIR, exist_ok=True)
    os.makedirs(Config.IMAGES_DIR, exist_ok=True)
    os.makedirs(Config.AUDIO_DIR, exist_ok=True)
    
    # Create static directories if they don't exist
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
    os.makedirs(static_dir, exist_ok=True)
    static_assets_dir = os.path.join(static_dir, "assets")
    os.makedirs(static_assets_dir, exist_ok=True)
    
    yield
    # Code to run on shutdown (if any)
    print("Shutting down...")

app = FastAPI(title="Shorts Video API", lifespan=lifespan)

# Define the list of allowed origins (frontends)
origins = [
    "https://shorts-video-six.vercel.app",
    "https://shorts-video-alpha.vercel.app",
    "https://huggingface.co/spaces/johnwesley756/shorts-video",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Configure CORS with the specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory if it exists
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    if os.path.exists(os.path.join(static_dir, "assets")):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="static_assets")

# Register routes
app.include_router(video_router, prefix="/api/videos")

# Add the root endpoint
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

if __name__ == '__main__':
    import uvicorn
    # Use environment variables for port if available
    port = int(os.environ.get('PORT', Config.PORT))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=Config.DEBUG)