import React, { useState, useRef, useEffect } from "react";
import "./list.css";

const List = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleDropdownSelection = (type) => {
    setFileType(type);
    setDropdownOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    }
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Function to log selected text
  function selectedText() {
    console.log(window.getSelection().toString());
  }

  // Add event listener for mouseup to capture text selection in the document
  useEffect(() => {
    document.addEventListener("mouseup", selectedText);
    return () => {
      document.removeEventListener("mouseup", selectedText);
    };
  }, []);

  return (
    <div className="list">
      <div className="icons">
        <div className="dropdown" ref={dropdownRef}>
          <button className="File" onClick={toggleDropdown}>
            File
          </button>
          {dropdownOpen && (
            <div className="dropdown-content">
              <button onClick={() => handleDropdownSelection("pdf")}>
                Open PDF
              </button>
              <button onClick={() => handleDropdownSelection("word")}>
                Open Word
              </button>
              <button onClick={() => handleDropdownSelection("audio")}>
                Open Audio File
              </button>
            </div>
          )}
        </div>
        <button className="Edit">Edit</button>
        <button className="Transcribe">Transcribe</button>
        <button className="Export">Export</button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept={
          fileType === "pdf"
            ? "application/pdf"
            : fileType === "word"
            ? ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : fileType === "audio"
            ? "audio/*"
            : "*"
        }
        onChange={handleFileChange}
      />

      <div className="file-viewer">
        {fileUrl && fileType === "pdf" && (
          <iframe
            className="file-viewer-frame"
            src={fileUrl}
            title="PDF Viewer"
          ></iframe>
        )}
        {fileUrl && fileType === "audio" && (
          <audio controls src={fileUrl}>
            Your browser does not support the audio element.
          </audio>
        )}
        {fileUrl && fileType === "word" && (
          <div>
            <p>Word file opened. Click the link below to view it:</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Open Word Document
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
