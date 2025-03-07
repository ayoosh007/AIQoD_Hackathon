import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./chat.css";

const Chat = () => {
  const [messages, setMessages] = useState([]); // Stores chat messages
  const [input, setInput] = useState(""); // Input field state
  const [isStreaming, setIsStreaming] = useState(false); // Streaming state
  const endRef = useRef(null); // Ref for auto-scrolling
  const wsRef = useRef(null); // Ref for the WebSocket connection
  const audioStreamRef = useRef(null); // Ref for the audio stream
  const audioContextRef = useRef(null); // Ref for the AudioContext
  const processorRef = useRef(null); // Ref for the ScriptProcessorNode

  // Auto-scroll to the bottom of the chat whenever messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to send text messages via HTTP POST
  const sendMessage = async () => {
    if (!input.trim()) return; // Prevent sending empty messages

    const userInput = input;
    // Add the user's message to state
    setMessages((prev) => [...prev, { text: userInput, sender: "user" }]);
    setInput(""); // Clear input field

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDLGNY6W2hChPjC0ait2BEgtbedtN_caaU",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userInput }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data?.candidates?.[0]?.content?.parts) {
        // Join all text parts into one string
        const geminiMessageText = data.candidates[0].content.parts
          .map((part) => part.text)
          .join(" ");
        setMessages((prev) => [
          ...prev,
          { text: geminiMessageText, sender: "gemini" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "No response from API", sender: "gemini" },
        ]);
      }
    } catch (error) {
      console.error("Error contacting API:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error contacting API", sender: "gemini" },
      ]);
    }
  };

  // Function to toggle audio streaming via WebSocket using the Web Audio API
  const toggleStreaming = async () => {
    if (isStreaming) {
      // Stop streaming: close the WebSocket, stop tracks, and close the AudioContext
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsStreaming(false);
    } else {
      try {
        // Request access to the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        // Create an AudioContext (the sample rate will typically be 44100 Hz)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create a media stream source from the microphone input
        const source = audioContext.createMediaStreamSource(stream);

        // Create a ScriptProcessorNode to capture raw PCM audio data.
        // Buffer size can be 4096; 1 input channel and 1 output channel.
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        // Connect the source to the processor, and the processor to the destination
        source.connect(processor);
        processor.connect(audioContext.destination);

        // Open the WebSocket connection to your Python server
        wsRef.current = new WebSocket("ws://localhost:8765");
        wsRef.current.binaryType = "arraybuffer";

        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Process incoming message (adjust structure per Gemini API docs)
            if (data?.candidates?.[0]?.content?.parts) {
              const geminiMessageText = data.candidates[0].content.parts
                .map((part) => part.text)
                .join(" ");
              setMessages((prev) => [
                ...prev,
                { text: geminiMessageText, sender: "gemini" },
              ]);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket closed");
        };

        // In the processor's audio processing event, convert the raw audio to 16-bit PCM
        processor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          // Convert Float32 samples (range -1 to 1) to Int16
          const int16Buffer = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          // Send the raw PCM data over the WebSocket if the connection is open.
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(int16Buffer.buffer);
          }
        };

        setIsStreaming(true);
      } catch (error) {
        console.error("Error accessing microphone or connecting to WebSocket:", error);
      }
    }
  };

  return (
    <div className="chat">
      <div className="top"></div>
      <div className="texts"></div>
      <p></p>
      <div></div>
      <div className="center">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === "user" ? "own" : ""}`}
          >
            <div className="texts">
              <div className="markdown-content">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="bottom">
        <div className="icons">
          {/* Toggle streaming on mic click */}
          <img
            src="./mic.png"
            alt="Mic"
            onClick={toggleStreaming}
            style={{ cursor: "pointer" }}
          />
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="circular">
          <img src="./plus.png" alt="" />
        </button>
        <button className="sendButton" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
