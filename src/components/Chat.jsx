import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Paperclip, Send, Reply } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_BASE_URL);

export default function Chat({ currentUserId, currentUserName, targetUserId: propTargetId, targetUserName: propTargetName, onBack }) {
  const location = useLocation();

  const targetUserId = location.state?.selectedUser?.id || location.state?.targetUserId || propTargetId;
  const targetUserName = location.state?.selectedUser?.name || location.state?.targetUserName || propTargetName || 'Chat Partner';

  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [viewerImage, setViewerImage] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const swipeStartRef = useRef(null);
  const recorderRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const roomId = [currentUserId, targetUserId].filter(Boolean).sort().join('_');

  const markMessagesAsRead = () => {
    if (!targetUserId) return;
    socket.emit('mark_as_read', { roomId, readerId: currentUserId, senderId: targetUserId });

    const token = localStorage.getItem('token');
    if (!token) return;

    axios.post(`${API_BASE_URL}/api/users/read`,
      { senderId: targetUserId, receiverId: currentUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(err => console.error('Error updating read status:', err));
  };

  const updateMessageStatus = (messageId, nextStatus) => {
    setChatLog((prev) =>
      prev.map((msg) => {
        const msgId = msg.id || msg.tempId;
        if (String(msgId) === String(messageId)) {
          return { ...msg, status: nextStatus, is_read: nextStatus === 'read' };
        }
        return msg;
      })
    );
  };

  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    socket.emit('register_user', currentUserId);
    socket.emit('join_room', roomId);

    axios.get(`${API_BASE_URL}/api/users/history/${roomId}`)
      .then((res) => {
        setChatLog(
          (Array.isArray(res.data) ? res.data : []).map((msg) => ({
            ...msg,
            status: msg.is_read ? 'read' : 'delivered',
          }))
        );
        markMessagesAsRead();
      })
      .catch(err => console.error('Error loading history:', err));

    const handleReceiveMessage = (newMessage) => {
      const sender = newMessage.sender_id || newMessage.senderId;
      if (String(sender) === String(currentUserId)) return;

      setChatLog((prev) => [...prev, { ...newMessage, is_read: true, status: 'read' }]);
      setIsTyping(false);
      markMessagesAsRead();
    };

    const handleMessagesRead = ({ readerId, senderId }) => {
      if (String(readerId) === String(targetUserId) && String(senderId) === String(currentUserId)) {
        setChatLog((prev) =>
          prev.map((msg) => {
            const sender = msg.sender_id || msg.senderId;
            if (String(sender) === String(currentUserId)) {
              return { ...msg, is_read: true, status: 'read' };
            }
            return msg;
          })
        );
      }
    };

    const handleUserTyping = ({ userId }) => {
      if (String(userId) === String(targetUserId)) setIsTyping(true);
    };

    const handleUserStopTyping = ({ userId }) => {
      if (String(userId) === String(targetUserId)) setIsTyping(false);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_marked_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_marked_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [roomId, currentUserId, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping, selectedFile, replyTo]);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type?.startsWith('image/')) {
      setSelectedImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const imageGallery = chatLog.filter((msg) => {
    const msgType = msg.message_type || msg.messageType;
    const fileUrl = msg.file_url || msg.fileUrl;
    return msgType === 'image' && fileUrl;
  }).map((msg) => msg.file_url || msg.fileUrl);

  const openImageViewer = (url) => {
    const index = imageGallery.findIndex((item) => item === url);
    setViewerImage(url);
    setViewerIndex(index >= 0 ? index : 0);
    setZoomLevel(1);
  };

  const shiftViewerImage = (direction) => {
    if (!imageGallery.length) return;

    const nextIndex = (viewerIndex + direction + imageGallery.length) % imageGallery.length;
    setViewerImage(imageGallery[nextIndex]);
    setViewerIndex(nextIndex);
    setZoomLevel(1);
  };

  const touchStartXRef = useRef(null);

  const handleViewerTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
  };

  const handleViewerTouchEnd = (event) => {
    if (touchStartXRef.current === null) return;

    const diffX = (event.changedTouches?.[0]?.clientX ?? touchStartXRef.current) - touchStartXRef.current;
    if (Math.abs(diffX) > 60) {
      shiftViewerImage(diffX < 0 ? 1 : -1);
    }

    touchStartXRef.current = null;
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { roomId, userId: currentUserId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId, userId: currentUserId });
    }, 1500);
  };

  const handleSwipeStart = (event, msg) => {
    const point = event.touches ? event.touches[0] : event;
    swipeStartRef.current = { x: point.clientX, message: msg };
  };

  const handleSwipeEnd = (event, msg) => {
    if (!swipeStartRef.current) return;
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const deltaX = point.clientX - swipeStartRef.current.x;

    if (deltaX < -55) {
      setReplyTo(msg);
    }

    swipeStartRef.current = null;
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice notes are not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      console.error('Voice note permission failed:', error);
      alert('Microphone access is required to record a voice note.');
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const handleFileSelection = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    socket.emit('stop_typing', { roomId, userId: currentUserId });

    let attachmentData = null;

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const token = localStorage.getItem('token');

      try {
        const uploadRes = await axios.post(`${API_BASE_URL}/api/users/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        attachmentData = uploadRes.data;
      } catch (err) {
        console.error('File upload failed:', err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const fileUrl = attachmentData ? (attachmentData.fileUrl || attachmentData.file_url) : null;
    const fileName = attachmentData ? (attachmentData.fileName || attachmentData.file_name) : null;
    const msgType = attachmentData ? (attachmentData.messageType || attachmentData.message_type) : 'text';
    const tempId = `temp-${Date.now()}`;

    const messageData = {
      id: tempId,
      tempId,
      roomId,
      sender_id: currentUserId,
      senderId: currentUserId,
      receiver_id: targetUserId,
      receiverId: targetUserId,
      senderName: currentUserName,
      message: message.trim(),
      messageText: message.trim(),
      message_type: msgType,
      messageType: msgType,
      file_url: fileUrl,
      fileUrl: fileUrl,
      file_name: fileName,
      fileName: fileName,
      is_read: false,
      status: 'sent',
      reply_to: replyTo ? {
        id: replyTo.id,
        authorName: replyTo.authorName || targetUserName,
        message: replyTo.message || '',
      } : null,
      replyTo: replyTo ? {
        id: replyTo.id,
        authorName: replyTo.authorName || targetUserName,
        message: replyTo.message || '',
      } : null,
      created_at: new Date().toISOString(),
    };

    socket.emit('send_message', messageData);
    setChatLog((prev) => [...prev, messageData]);

    setTimeout(() => updateMessageStatus(tempId, 'delivered'), 600);
    setMessage('');
    setSelectedFile(null);
    setReplyTo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="chat-card">
      <div className="chat-header">
        {onBack && (
          <button type="button" className="chat-back-btn" onClick={onBack} aria-label="Back to conversations">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="user-avatar">{targetUserName ? targetUserName.charAt(0).toUpperCase() : 'C'}</div>
        <div className="user-info">
          <h4>{targetUserName}</h4>
          <span className="status-badge"><span className="dot"></span> Online</span>
        </div>
      </div>

      <div className="chat-body">
        {replyTo && (
          <div className="reply-preview-bar">
            <div className="reply-indicator"><Reply size={12} /> Replying to {replyTo.authorName || 'message'}</div>
            <button type="button" className="reply-cancel-btn" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}

        {chatLog.map((msg, index) => {
          const sender = msg.sender_id || msg.senderId;
          const isMine = String(sender) === String(currentUserId);
          const msgType = msg.message_type || msg.messageType || 'text';
          const fileUrl = msg.file_url || msg.fileUrl;
          const fileName = msg.file_name || msg.fileName;
          const replyMeta = msg.reply_to || msg.replyTo;
          const status = msg.status || (msg.is_read ? 'read' : isMine ? 'delivered' : '');

          const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id || msg.tempId || index}
              className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}
              onTouchStart={(event) => handleSwipeStart(event, msg)}
              onTouchEnd={(event) => handleSwipeEnd(event, msg)}
              onMouseDown={(event) => handleSwipeStart(event, msg)}
              onMouseUp={(event) => handleSwipeEnd(event, msg)}
            >
              <div className="message-bubble">
                {replyMeta && (
                  <div className="message-reply-preview">
                    <span className="reply-author">{replyMeta.authorName || 'Reply'}</span>
                    <span>{replyMeta.message || 'Attachment'}</span>
                  </div>
                )}

                {msgType === 'image' && fileUrl && (
                  <div className="attachment-container">
                    <button
                      type="button"
                      className="image-open-btn"
                      onClick={() => openImageViewer(fileUrl)}
                    >
                      <img src={fileUrl} alt="Attachment" className="chat-image-attachment" />
                    </button>
                  </div>
                )}
                {msgType === 'file' && fileUrl && (
                  <div className="file-attachment-block">
                    {fileUrl.toLowerCase().includes('.mp3') || fileUrl.toLowerCase().includes('.wav') || fileUrl.toLowerCase().includes('.m4a') || fileUrl.toLowerCase().includes('.webm') ? (
                      <audio controls src={fileUrl} className="voice-note-player" />
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noreferrer" className="chat-file-attachment">
                        📄 {fileName || 'Download Attachment'}
                      </a>
                    )}
                  </div>
                )}
                {msg.message && <p className="message-text">{msg.message}</p>}
                <div className="message-meta">
                  <span className="timestamp">{time}</span>
                  {isMine && status && (
                    <span className={`read-status ${status === 'read' ? 'read' : 'sent'}`}>
                      {status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="message-wrapper theirs">
            <div className="message-bubble typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {selectedFile && (
        <div className="file-preview-bar">
          {selectedFile.type?.startsWith('image/') && selectedImagePreview ? (
            <div className="attachment-preview-wrap">
              <img
                src={selectedImagePreview}
                alt="Preview"
                className="attachment-preview-image"
                onClick={() => {
                  setViewerImage(selectedImagePreview);
                }}
              />
              <span className="file-name">{selectedFile.name}</span>
            </div>
          ) : (
            <span className="file-name">
              {selectedFile.type?.startsWith('audio/') ? '🎙️' : '📎'} {selectedFile.name}
            </span>
          )}
          <button type="button" className="remove-file-btn" onClick={() => setSelectedFile(null)}>×</button>
        </div>
      )}

      {viewerImage && (
        <div className="image-viewer-backdrop" onClick={() => setViewerImage(null)}>
          <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()} onTouchStart={handleViewerTouchStart} onTouchEnd={handleViewerTouchEnd}>
            <button
              type="button"
              className="image-viewer-close"
              onClick={() => setViewerImage(null)}
              aria-label="Close image"
            >
              ×
            </button>

            {imageGallery.length > 1 && (
              <>
                <button type="button" className="image-nav-btn prev" onClick={() => shiftViewerImage(-1)} aria-label="Previous image">‹</button>
                <button type="button" className="image-nav-btn next" onClick={() => shiftViewerImage(1)} aria-label="Next image">›</button>
              </>
            )}

            <div className="image-viewer-controls">
              <button type="button" className="zoom-btn" onClick={() => setZoomLevel((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))))}>−</button>
              <span>{zoomLevel.toFixed(2)}x</span>
              <button type="button" className="zoom-btn" onClick={() => setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}>+</button>
              <button type="button" className="zoom-btn reset" onClick={() => setZoomLevel(1)}>Reset</button>
            </div>

            <img
              src={viewerImage}
              alt="Full size view"
              className="image-viewer-image"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-footer">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileSelection}
        />

        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file or image"
        >
          <Paperclip size={18} />
        </button>

        <button
          type="button"
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
          title={isRecording ? 'Stop recording' : 'Record voice note'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {isRecording && <span className="recording-label">{recordingSeconds}s</span>}

        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder={isUploading ? 'Uploading file...' : 'Write a message...'}
          disabled={isUploading}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={(!message.trim() && !selectedFile) || isUploading}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}