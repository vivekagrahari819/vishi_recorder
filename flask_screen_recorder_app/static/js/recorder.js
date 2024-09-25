let mediaRecorder;
let recordedChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoPreview = document.getElementById('videoPreview');
const status = document.getElementById('status');
const videoList = document.getElementById('videoList');  // List of videos

startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        videoPreview.srcObject = stream;
        videoPreview.muted = true;

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
        recordedChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = handleStop;

        mediaRecorder.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = 'Recording...';

    } catch (err) {
        console.error('Error accessing display media: ', err);
    }
});

stopBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = 'Recording stopped. Processing video...';

    const tracks = videoPreview.srcObject.getTracks();
    tracks.forEach(track => track.stop());  // Stop screen capture stream
});

async function handleStop() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = [];

    // Preview the recorded video
    videoPreview.srcObject = null;
    videoPreview.src = URL.createObjectURL(blob);
    videoPreview.controls = true;
    videoPreview.muted = false;
    videoPreview.play();

    // Save the video file to the server
    const formData = new FormData();
    formData.append('video', blob, 'recording_' + Date.now() + '.webm');  // Unique filename

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const message = await response.text();
        status.textContent = message;

        // Append the new video to the list
        const newVideoDiv = document.createElement('div');
        newVideoDiv.classList.add('video-item');
        const newVideo = document.createElement('video');
        newVideo.src = URL.createObjectURL(blob);
        newVideo.controls = true;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('deleteBtn');
        deleteBtn.dataset.filename = 'recording_' + Date.now() + '.webm';

        deleteBtn.addEventListener('click', () => deleteVideo(deleteBtn.dataset.filename));

        newVideoDiv.appendChild(newVideo);
        newVideoDiv.appendChild(deleteBtn);
        videoList.appendChild(newVideoDiv);

    } catch (error) {
        console.error('Error uploading video: ', error);
        status.textContent = 'Failed to upload video.';
    }
}

// Function to delete a video
async function deleteVideo(filename) {
    try {
        const response = await fetch(`/delete/${filename}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            status.textContent = result.message;

            // Remove the video element from the DOM
            const videoItem = document.querySelector(`[data-filename="${filename}"]`).parentElement;
            videoItem.remove();
        } else {
            status.textContent = result.error;
        }
    } catch (error) {
        console.error('Error deleting video: ', error);
        status.textContent = 'Failed to delete video.';
    }
}

// Attach event listeners to all delete buttons for existing videos
document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', () => deleteVideo(btn.dataset.filename));
});
