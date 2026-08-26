import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function ChatPage() {
  const { userId } = useParams(); // ID of the recipient
  const location = useLocation();
  const navigate = useNavigate();

  // Selected user passed from state or fallback
  const recipient = location.state?.selectedUser || { id: userId, name: 'Campus User' };

  // Current logged in user ID from localStorage/JWT
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id || null;

  // Generate deterministic room ID (e.g. "1_5" or "5_1")
  const roomId = currentUserId 
    ? [Number(currentUserId), Number(userId)].sort((a, b) => a - b).join('_')
    : null;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch chat history on component load
  useEffect(() => {
    if (roomId) {
      fetchChatHistory();
    }
  }, [roomId]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError('');
      // Calls GET /api/users/history/:roomId
      const data = await apiClient(`/users/history/${roomId}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const payload = {
      receiverId: userId,
      roomId,
      message: newMessage,
      messageType: 'text',
    };

    try {
      // Send message via API client
      const sentMsg = await apiClient('/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Append locally to chat window
      setMessages((prev) => [...prev, sentMsg || { ...payload, sender_id: currentUserId, created_at: new Date() }]);
      setNewMessage('');
    } catch (err) {
      alert(`Failed to send message: ${err.message}`);
    }
  };

  return (
    <div style={styles.chatWrapper}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <div style={styles.headerInfo}>
          <div style={styles.avatar}>{(recipient.name || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <h3 style={styles.recipientName}>{recipient.name || 'Campus User'}</h3>
            <span style={styles.recipientSub}>{recipient.campus || 'Busitema University'}</span>
          </div>
        </div>
      </div>

      {/* MESSAGES BODY */}
      <div style={styles.messageBox}>
        {loading ? (
          <div style={styles.center}>Loading conversation...</div>
        ) : error ? (
          <div style={styles.centerError}>{error}</div>
        ) : messages.length === 0 ? (
          <div style={styles.center}>No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = String(msg.sender_id || msg.senderId) === String(currentUserId);
            return (
              <div
                key={msg.id || idx}
                style={{
                  ...styles.bubbleWrapper,
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    backgroundColor: isMe ? '#2563eb' : '#f1f5f9',
                    color: isMe ? '#ffffff' : '#0f172a',
                    borderBottomRightRadius: isMe ? '2px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '2px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.4' }}>{msg.message}</p>
                  <span
                    style={{
                      ...styles.timestamp,
                      color: isMe ? 'rgba(255,255,255,0.75)' : '#64748b',
                    }}
                  >
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSendMessage} style={styles.inputArea}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`Message ${recipient.name || 'user'}...`}
          style={styles.textInput}
        />
        <button type="submit" style={styles.sendBtn}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  chatWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '720px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientName: { margin: 0, fontSize: '1rem', fontWeight: '700', color: '#0f172a' },
  recipientSub: { fontSize: '0.78rem', color: '#64748b' },
  messageBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: '#f8fafc',
  },
  bubbleWrapper: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '70%',
    padding: '0.65rem 0.95rem',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  timestamp: {
    display: 'block',
    fontSize: '0.68rem',
    marginTop: '0.25rem',
    textAlign: 'right',
  },
  center: { textAlign: 'center', color: '#64748b', marginTop: '2rem', fontSize: '0.9rem' },
  centerError: { textAlign: 'center', color: '#dc2626', marginTop: '2rem', fontSize: '0.9rem' },
  inputArea: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.85rem 1.25rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  textInput: {
    flex: 1,
    padding: '0.65rem 1rem',
    borderRadius: '24px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    fontSize: '0.9rem',
  },
  sendBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: '24px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer',
  },
};