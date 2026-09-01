import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './ConversationList.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_BASE_URL);

export default function ConversationList({ currentUserId, onSelectUser, activeTargetId, onUnreadCountChange }) {
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectContact = async (contact) => {
    onSelectUser(contact);
    setConversations((prev) => prev.map((conversation) => (
      conversation.id === contact.id ? { ...conversation, unreadCount: 0 } : conversation
    )));

    try {
      await axios.post(`${API_BASE_URL}/api/users/read`, { senderId: contact.id }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  useEffect(() => {
    // 1. Fetch recent conversations or user contacts
    axios.get(`${API_BASE_URL}/api/users/conversations/${currentUserId}`)
      .then((res) => setConversations(res.data))
      .catch((err) => console.error('Failed to load conversations:', err));

    // 2. Listen for real-time presence updates
    socket.emit('register_user', currentUserId);

    socket.on('get_online_users', (usersList) => {
      setOnlineUsers(usersList); // Array of online user IDs
    });

    // 3. Update last message preview in real time
    socket.on('receive_message', (newMessage) => {
      const senderId = newMessage.sender_id || newMessage.senderId;
      const receiverId = newMessage.receiver_id || newMessage.receiverId;
      setConversations((prev) => prev.map((conv) => {
        if (String(conv.id) !== String(senderId) && String(conv.id) !== String(receiverId)) return conv;
        const isOpen = String(conv.id) === String(activeTargetId);
        return { ...conv, lastMessage: newMessage.message, lastMessageTime: newMessage.created_at, unreadCount: isOpen ? 0 : Number(conv.unreadCount || 0) + 1 };
      }));
    });

    return () => {
      socket.off('get_online_users');
      socket.off('receive_message');
    };
  }, [currentUserId, activeTargetId, onSelectUser]);

  useEffect(() => {
    onUnreadCountChange?.(conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0));
  }, [conversations, onUnreadCountChange]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="conversation-list-container">
      <div className="conversation-header">
        <h3>Messages</h3>
        <input 
          type="text" 
          placeholder="Search chat..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="conversation-items">
        {filteredConversations.map((user) => {
          const isSelected = String(user.id) === String(activeTargetId);
          const isOnline = onlineUsers.includes(String(user.id));
          const time = user.lastMessageTime 
            ? new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '';

          const avatarUrl = user.avatar_url || user.avatarUrl;

          return (
            <div
              key={user.id}
              className={`conversation-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleSelectContact(user)}
            >
              <div className="avatar-wrapper">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="user-avatar user-avatar-image" />
                ) : (
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                )}
                <span className={`presence-dot ${isOnline ? 'online' : 'offline'}`}></span>
              </div>

              <div className="conversation-details">
                <div className="top-line">
                  <span className="user-name">{user.name}</span>
                  {time && <span className="message-time">{time}</span>}
                </div>
                <div className="bottom-line">
                  <p className="last-message">{user.lastMessage || 'No messages yet'}</p>
                  {user.unreadCount > 0 && !isSelected && (
                    <span className="unread-badge">{user.unreadCount}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}