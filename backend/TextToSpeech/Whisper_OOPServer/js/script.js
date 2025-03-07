const startButton = document.getElementById('startButton');
const output = document.getElementById('output');
const status = document.getElementById('status');

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Check if browser supports audio recording
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    startButton.onclick = async () => {
        if (!isRecording) {
            // Start recording
            let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            startButton.textContent = "Stop Recording";
            status.textContent = "Recording...";

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                sendAudioToServer(audioBlob);
            };
        } else {
            // Stop recording
            mediaRecorder.stop();
            isRecording = false;
            startButton.textContent = "Start Recording";
            status.textContent = "Processing...";
        }
    };
} else {
    status.textContent = "Audio recording not supported in this browser.";
    startButton.disabled = true;
}

// Function to send recorded audio to Django server
async function sendAudioToServer(audioBlob) {
    let formData = new FormData();
    formData.append("file", audioBlob, "speech.wav");

    try {
        let response = await fetch("http://127.0.0.1:8000/transcribe/", {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json',  // Ensure it matches your expected content type
            },
        });

        if (!response.ok) throw new Error("Server Error");

        let data = await response.json();
        output.textContent = data.transcript || "No transcript received.";
        status.textContent = "Click the button and start speaking...";
    } catch (error) {
        status.textContent = "Error: " + error.message;
    }
}
