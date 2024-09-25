from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import os

app = Flask(__name__)

# Path to the uploads directory
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/')
def index():
    # List all videos in the uploads folder
    videos = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template('index.html', videos=videos)


@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return 'No video file provided!', 400

    video = request.files['video']
    
    if video.filename == '':
        return 'No selected video', 400

    # Save the uploaded video
    video.save(os.path.join(app.config['UPLOAD_FOLDER'], video.filename))
    return 'Video successfully uploaded!', 200


@app.route('/delete/<filename>', methods=['DELETE'])
def delete_video(filename):
    # Delete the video file from the server
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(video_path):
        os.remove(video_path)
        return jsonify({"message": "Video deleted successfully!"}), 200
    else:
        return jsonify({"error": "Video not found!"}), 404


@app.route('/uploads/<filename>')
def uploaded_video(filename):
    # Serve the uploaded video file
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(debug=True)
