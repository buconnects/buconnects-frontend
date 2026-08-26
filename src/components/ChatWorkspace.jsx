import React, { useState } from 'react';
import ConversationList from './ConversationList';
import Chat from './Chat';
import './ChatWorkspace.css';

export default function ChatWorkspace({ currentUser }) {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="chat-workspace-container">
      <ConversationList 
        currentUserId={currentUser.id}
        activeTargetId={selectedUser?.id}
        onSelectUser={(user) => setSelectedUser(user)}
      />

      <div className="chat-main-area">
        {selectedUser ? (
          <Chat 
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            targetUserId={selectedUser.id}
            targetUserName={selectedUser.name}
          />
        ) : (
          <div className="no-chat-selected">
            <p>Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}