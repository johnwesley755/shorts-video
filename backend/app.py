from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from routes.video_routes import video_bp
from config import Config

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(video_bp, url_prefix='/api/videos')

# Basic error handling
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Create storage directories if they don't exist
    os.makedirs(Config.TEMP_DIR, exist_ok=True)
    os.makedirs(Config.VIDEOS_DIR, exist_ok=True)
    os.makedirs(Config.IMAGES_DIR, exist_ok=True)
    os.makedirs(Config.AUDIO_DIR, exist_ok=True)
    
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)