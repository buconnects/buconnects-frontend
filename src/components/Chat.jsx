import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './Chat.css';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    socket.emit('register_user', currentUserId);
    socket.emit('join_room', roomId);

    // Fetch initial chat history endpoint
    axios.get(`${API_BASE_URL}/api/users/history/${roomId}`)
      .then(res => {
        setChatLog(res.data);
        markMessagesAsRead();
      })
      .catch(err => console.error('Error loading history:', err));

    const handleReceiveMessage = (newMessage) => {
      const sender = newMessage.sender_id || newMessage.senderId;
      if (String(sender) === String(currentUserId)) return;

      setChatLog((prev) => [...prev, { ...newMessage, is_read: true }]);
      setIsTyping(false);
      markMessagesAsRead();
    };

    const handleMessagesRead = ({ readerId }) => {
      if (String(readerId) === String(targetUserId)) {
        setChatLog((prev) =>
          prev.map((msg) => ({ ...msg, is_read: true }))
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
  }, [chatLog, isTyping, selectedFile]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { roomId, userId: currentUserId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId, userId: currentUserId });
    }, 1500);
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
            'Authorization': `Bearer ${token}`
          }
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

    const messageData = {
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
      created_at: new Date().toISOString()
    };

    socket.emit('send_message', messageData);
    setChatLog((prev) => [...prev, messageData]);

    setMessage('');
    setSelectedFile(null);
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
        {chatLog.map((msg, index) => {
          const sender = msg.sender_id || msg.senderId;
          const isMine = String(sender) === String(currentUserId);
          const msgType = msg.message_type || msg.messageType || 'text';
          const fileUrl = msg.file_url || msg.fileUrl;
          const fileName = msg.file_name || msg.fileName;

          const time = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          return (
            <div key={msg.id || index} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
              <div className="message-bubble">
                {msgType === 'image' && fileUrl && (
                  <div className="attachment-container">
                    <img src={fileUrl} alt="Attachment" className="chat-image-attachment" />
                  </div>
                )}
                {msgType === 'file' && fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" className="chat-file-attachment">
                    📄 {fileName || 'Download Attachment'}
                  </a>
                )}
                {msg.message && <p className="message-text">{msg.message}</p>}
                <div className="message-meta">
                  <span className="timestamp">{time}</span>
                  {isMine && (
                    <span className={`read-status ${msg.is_read ? 'read' : 'sent'}`}>
                      {msg.is_read ? ' ✓✓' : ' ✓'}
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
          <span className="file-name">📎 {selectedFile.name}</span>
          <button type="button" className="remove-file-btn" onClick={() => setSelectedFile(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-footer">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <button 
          type="button" 
          className="attach-btn" 
          onClick={() => fileInputRef.current?.click()}
          title="Attach File or Image"
        >
          📎
        </button>

        <input 
          type="text" 
          value={message} 
          onChange={handleInputChange}
          placeholder={isUploading ? "Uploading file..." : "Write a message..."} 
          disabled={isUploading}
        />

        <button 
          type="submit" 
          className="send-btn" 
          disabled={(!message.trim() && !selectedFile) || isUploading}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}