import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Image as ImageIcon, MessageCircle, Paperclip, Repeat2, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import postService from '../services/postService';
import apiClient from '../services/apiClient';
import io from 'socket.io-client';
import './SocialFeed.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://buconnects-backend-to2j.onrender.com';
let socket;

// HELPER: Resolves relative uploaded media paths & transforms legacy localhost URLs to live server
const getMediaUrl = (path) => {
  if (!path) return '';
  let rawPath = Array.isArray(path) ? path[0] : path;
  if (typeof rawPath !== 'string') return '';

  // 1. Determine active backend host
  const activeBackend = (import.meta.env.VITE_API_URL || 'https://buconnects-backend-to2j.onrender.com')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

  // 2. Fix legacy localhost URLs stored in MySQL
  if (rawPath.startsWith('http://localhost:5000') || rawPath.startsWith('http://127.0.0.1:5000')) {
    rawPath = rawPath.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, '');
  }

  // 3. Return as-is if it is an external HTTPS link
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }

  // 4. Append clean relative path to backend origin
  const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return `${activeBackend}${cleanPath}`;
};

// SKELETON LOADERS
const PostSkeleton = () => (
  <div style={styles.postCard}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{ ...styles.skeleton, width: '40px', height: '40px', borderRadius: '50%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        <div style={{ ...styles.skeleton, width: '35%', height: '14px' }} />
        <div style={{ ...styles.skeleton, width: '20%', height: '10px' }} />
      </div>
    </div>
    <div style={{ ...styles.skeleton, width: '90%', height: '14px', marginBottom: '0.5rem' }} />
    <div style={{ ...styles.skeleton, width: '75%', height: '14px', marginBottom: '1rem' }} />
    <div style={{ ...styles.skeleton, width: '100%', height: '180px', borderRadius: '12px' }} />
  </div>
);

const ChatSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
    <div style={{ alignSelf: 'flex-start', width: '60%' }}>
      <div style={{ ...styles.skeleton, height: '36px', borderRadius: '12px' }} />
    </div>
    <div style={{ alignSelf: 'flex-end', width: '55%' }}>
      <div style={{ ...styles.skeleton, height: '36px', borderRadius: '12px' }} />
    </div>
    <div style={{ alignSelf: 'flex-start', width: '40%' }}>
      <div style={{ ...styles.skeleton, height: '36px', borderRadius: '12px' }} />
    </div>
    <div style={{ alignSelf: 'flex-end', width: '70%' }}>
      <div style={{ ...styles.skeleton, height: '36px', borderRadius: '12px' }} />
    </div>
  </div>
);

export default function SocialFeed({ onStartChat }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Post Creation States
  const [content, setContent] = useState('');
  const [campus, setCampus] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Active Comment Input States
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [deletingComment, setDeletingComment] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [reposting, setReposting] = useState({});

  // Chat Drawer & Selected User States
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer Active Conversation State
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [drawerMessages, setDrawerMessages] = useState([]);
  const [drawerInputMessage, setDrawerInputMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    if (isChatDrawerOpen) {
      fetchUsers();
    }
  }, [isChatDrawerOpen]);

  // Connect WebSocket for Drawer Messaging
  useEffect(() => {
    if (activeChatUser && user?.id) {
      if (!socket) socket = io(API_BASE_URL);
      const roomId = [user.id, activeChatUser.id || activeChatUser._id].sort().join('_');

      socket.emit('register_user', user.id);
      socket.emit('join_room', roomId);

      const handleReceiveMessage = (newMessage) => {
        setDrawerMessages((prev) => [...prev, newMessage]);
      };

      socket.on('receive_message', handleReceiveMessage);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
      };
    }
  }, [activeChatUser, user]);

  async function fetchFeed() {
    try {
      setLoading(true);
      const data = await postService.getAllPosts();
      setPosts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load feed.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      setUsersLoading(true);
      setUsersError('');

      const data = await apiClient('/users');
      const userList = Array.isArray(data) ? data : data?.users || [];
      setUsers(userList);
    } catch (err) {
      setUsersError(err.message || 'Failed to load campus users.');
    } finally {
      setUsersLoading(false);
    }
  }

  // Fetch Message History when a person is clicked
  const handleSelectUserToChat = async (selectedUser) => {
    setActiveChatUser(selectedUser);
    const targetId = selectedUser.id || selectedUser._id;
    const roomId = [user?.id, targetId].sort().join('_');

    try {
      setMessagesLoading(true);
      const history = await apiClient(`/users/history/${roomId}`);
      setDrawerMessages(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Failed to fetch conversation history:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendDrawerMessage = async (e) => {
    e.preventDefault();
    if (!drawerInputMessage.trim() || !activeChatUser) return;

    const targetId = activeChatUser.id || activeChatUser._id;
    const roomId = [user?.id, targetId].sort().join('_');

    const messageData = {
      roomId,
      sender_id: user?.id,
      senderId: user?.id,
      receiver_id: targetId,
      receiverId: targetId,
      senderName: user?.name || user?.username || 'Me',
      message: drawerInputMessage.trim(),
      messageText: drawerInputMessage.trim(),
      message_type: 'text',
      messageType: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (!socket) socket = io(API_BASE_URL);
    socket.emit('send_message', messageData);

    setDrawerMessages((prev) => [...prev, messageData]);
    setDrawerInputMessage('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      clearSelectedFile();
    }
  };

  const clearSelectedFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(null);
    setFilePreview(null);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      alert('Please add text content or attach a media file.');
      return;
    }

    try {
      setSubmitting(true);
      const newPost = await postService.createPost({ content, campus, file });

      setPosts((prev) => [newPost, ...prev]);

      setContent('');
      setCampus('');
      clearSelectedFile();
      e.target.reset();
    } catch (err) {
      alert(`Error creating post: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await postService.toggleLike(postId);
      const isLiked = Boolean(response?.isLiked ?? response?.liked ?? response?.status === 'liked');

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;

          const prevLiked = Boolean(post.isLikedByMe);
          const delta = isLiked && !prevLiked ? 1 : !isLiked && prevLiked ? -1 : 0;

          return {
            ...post,
            isLikedByMe: isLiked,
            likesCount: Math.max(0, Number(post.likesCount || 0) + delta),
          };
        })
      );
    } catch (err) {
      console.error('Like action failed:', err);
      alert(`Error toggling like: ${err.message}`);
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = (commentInputs[postId] ?? '').trim();

    if (!commentText) return;

    try {
      setSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      const newComment = await postService.addComment(postId, commentText);

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;

          const existingComments = post.comments || [];
          const commentAlreadyExists = existingComments.some((comment) => String(comment.id) === String(newComment.id));

          return {
            ...post,
            commentsCount: Math.max(0, Number(post.commentsCount || 0) + (commentAlreadyExists ? 0 : 1)),
            comments: commentAlreadyExists ? existingComments : [...existingComments, newComment],
          };
        })
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      alert(`Error posting comment: ${err.message}`);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentInputChange = (postId, text) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      setDeletingComment((prev) => ({ ...prev, [commentId]: true }));
      await postService.deleteComment(postId, commentId);
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            commentsCount: Math.max(0, Number(post.commentsCount) - 1),
            comments: (post.comments || []).filter((comment) => comment.id !== commentId),
          };
        })
      );
    } catch (err) {
      alert(`Error deleting comment: ${err.message}`);
    } finally {
      setDeletingComment((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleRepost = async (post) => {
    try {
      setReposting((prev) => ({ ...prev, [post.id]: true }));
      const repostedPost = await postService.repost(post.id);
      setPosts((prevPosts) => [repostedPost, ...prevPosts]);
      setSelectedMedia(null);
    } catch (err) {
      alert(`Error reposting post: ${err.message}`);
    } finally {
      setReposting((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  const handleAuthorClick = (post) => {
    const targetUser = {
      id: post.authorId || post.author_id,
      name: post.authorName || 'Campus User',
      campus: post.campus,
    };
    if (targetUser.id && String(targetUser.id) !== String(user?.id)) {
      setIsChatDrawerOpen(true);
      handleSelectUserToChat(targetUser);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    const nameMatches = (u.name || u.username || '').toLowerCase().includes(term);
    const campusMatches = (u.campus || '').toLowerCase().includes(term);
    return nameMatches || campusMatches;
  });

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorBox}>
          <p style={{ margin: 0, fontWeight: '600' }}>⚠️ {error}</p>
          <button onClick={fetchFeed} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        .feed-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .feed-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.12);
        }
        .action-btn {
          transition: all 0.15s ease;
        }
        .action-btn:hover {
          background-color: #f1f5f9 !important;
        }
        .fab-btn {
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-btn:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5) !important;
        }
        .user-item-row {
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .user-item-row:hover {
          background-color: #f8fafc !important;
          transform: translateX(2px);
        }
      `}</style>

      <div style={styles.container}>
        {/* POST CREATION CARD */}
        <form onSubmit={handleCreatePost} className="feed-create-card" style={styles.createCard}>
          <div style={styles.createHeader}>
            <div style={styles.avatarPlaceholder}></div>
            <h3 style={styles.createTitle}>Share something with campus</h3>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening on your campus today?"
            rows={3}
            className="feed-composer-textarea"
            style={styles.textarea}
          />

          {filePreview && (
            <div style={styles.previewContainer}>
              {file?.type.startsWith('video/') ? (
                <video src={filePreview} controls style={styles.previewMedia} />
              ) : (
                <img src={filePreview} alt="Selected Attachment Preview" style={styles.previewMedia} />
              )}
              <button
                type="button"
                onClick={clearSelectedFile}
                style={styles.removeFileBtn}
                title="Remove attachment"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="feed-composer-footer" style={styles.formFooter}>
            <div className="feed-composer-fields" style={styles.inputGroup}>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Campus (Optional)"
                style={styles.input}
              />
              <label className="feed-attach-button" style={styles.uploadLabel}>
                <Paperclip size={16} />
                <span>Attach media</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  style={styles.hiddenFileInput}
                />
              </label>
            </div>

            <button className="feed-post-button" type="submit" disabled={submitting} style={styles.primaryButton}>
              <Send size={16} />
              {submitting ? 'Publishing...' : 'Post Update'}
            </button>
          </div>
        </form>

        {/* POSTS LIST OR SKELETON LOADING */}
        <div style={styles.feedList}>
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '2.5rem' }}>📣</span>
              <p style={{ margin: '0.5rem 0 0', fontWeight: '600', color: '#475569' }}>No posts yet</p>
              <small style={{ color: '#94a3b8' }}>Be the first to share an update with your campus community!</small>
            </div>
          ) : (
            posts.map((post) => {
              const mediaSrc = getMediaUrl(post.mediaUrls);

              return (
                <article key={post.id} className="feed-card" style={styles.postCard}>
                  <div style={styles.postHeader}>
                    <button type="button" className="feed-author-button" onClick={() => handleAuthorClick(post)} style={styles.authorMeta}>
                      <div style={styles.userAvatar}>
                        {(post.authorName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.authorName}>{post.authorName || 'Campus User'}</div>
                        <div style={styles.postMetaSub}>
                          <span style={styles.campusBadge}>{post.campus || 'Main Campus'}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {post.content && <p style={styles.postContent}>{post.content}</p>}

                  {mediaSrc && (
                    <div style={styles.mediaWrapper}>
                      {mediaSrc.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={mediaSrc} controls style={styles.media} />
                      ) : (
                        <button
                          type="button"
                          className="feed-media-button"
                          onClick={() => setSelectedMedia({ src: mediaSrc, post })}
                        >
                          <img
                            src={mediaSrc}
                            alt="Post Attachment"
                            style={styles.media}
                            onError={(e) => {
                              console.error('Failed to load post image from:', mediaSrc);
                            }}
                          />
                          <span className="feed-media-hint"><ImageIcon size={16} /> Open image</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div style={styles.actionsBar}>
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className="action-btn"
                      style={{
                        ...styles.actionButton,
                        color: post.isLikedByMe ? '#ef4444' : '#64748b',
                      }}
                    >
                      <Heart size={18} fill={post.isLikedByMe ? 'currentColor' : 'none'} />
                      <span>{post.likesCount || 0} Likes</span>
                    </button>

                    <button type="button" onClick={() => toggleComments(post.id)} className={`comments-toggle-button ${expandedComments[post.id] ? 'open' : ''}`} style={styles.actionButton}>
                      <MessageCircle size={18} />
                      <span>{expandedComments[post.id] ? 'Hide comments' : 'comments'}</span>
                      <span className="comments-count-badge">{post.commentsCount || 0}</span>
                    </button>
                  </div>

                  {expandedComments[post.id] && (
                    <div style={styles.commentsSection}>
                      {post.comments && post.comments.length > 0 && (
                        <div style={styles.commentList}>
                          {post.comments.map((comment) => (
                            <div key={comment.id} style={styles.commentBubble}>
                              <strong className="comment-author-button" onClick={() => handleAuthorClick({ authorId: comment.authorId, authorName: comment.authorName })} style={styles.commentAuthor}>{comment.authorName || 'User'}</strong>
                              <span style={styles.commentText}>{comment.comment}</span>
                              {String(comment.authorId) === String(user?.id) && (
                                <button type="button" className="comment-delete-button" disabled={deletingComment[comment.id]} onClick={() => handleDeleteComment(post.id, comment.id)} title="Delete your comment">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleAddComment(e, post.id)}
                        style={styles.commentForm}
                      >
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                          placeholder="Add a comment..."
                          style={styles.commentInput}
                        />
                        <button
                          type="submit"
                          disabled={submittingComment[post.id]}
                          style={styles.commentSubmitBtn}
                        >
                          <Send size={14} />
                          <span>Send</span>
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>

      {selectedMedia && (
        <div className="feed-media-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="feed-media-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="feed-media-close" onClick={() => setSelectedMedia(null)} aria-label="Close image">
              <X size={20} />
            </button>
            <img src={getMediaUrl(selectedMedia.src)} alt="Expanded post attachment" />
            <div className="feed-media-modal-footer">
              <div>
                <strong>{selectedMedia.post.authorName || 'Campus User'}</strong>
                <span>Post attachment</span>
              </div>
              <button type="button" className="repost-button" disabled={reposting[selectedMedia.post.id]} onClick={() => handleRepost(selectedMedia.post)}>
                <Repeat2 size={17} />
                {reposting[selectedMedia.post.id] ? 'Reposting...' : 'Repost'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button
        onClick={() => setIsChatDrawerOpen(true)}
        className="fab-btn"
        style={styles.floatingChatBtn}
        aria-label="Start Chat"
      >
        <span>Start Chat</span>
      </button>

      {/* SLIDE-OVER CHAT DRAWER */}
      {isChatDrawerOpen && (
        <div style={styles.drawerOverlay} onClick={() => { setIsChatDrawerOpen(false); setActiveChatUser(null); }}>
          <div style={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>
                  {activeChatUser ? activeChatUser.name || 'Chat' : 'Select User to Chat'}
                </h3>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                  {activeChatUser ? 'Direct Message' : `${users.length} campus users`}
                </span>
              </div>
              <button onClick={() => { setIsChatDrawerOpen(false); setActiveChatUser(null); }} style={styles.drawerCloseBtn}>✕</button>
            </div>

            {!activeChatUser ? (
              <>
                <div style={styles.searchBarContainer}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or campus..."
                    style={styles.searchInput}
                  />
                </div>

                <div style={styles.drawerBody}>
                  {usersLoading ? (
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.5rem' }}>
                            <div style={{ ...styles.skeleton, width: '42px', height: '42px', borderRadius: '50%' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                              <div style={{ ...styles.skeleton, width: '50%', height: '12px' }} />
                              <div style={{ ...styles.skeleton, width: '30%', height: '10px' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : usersError ? (
                    <div style={styles.errorBox}>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{usersError}</p>
                      <button onClick={fetchUsers} style={styles.retryBtn}>Retry</button>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div style={styles.emptyUsersState}>
                      <span>🔍</span>
                      <p style={{ margin: '0.5rem 0 0', fontWeight: '600', color: '#64748b' }}>No users found</p>
                    </div>
                  ) : (
                    <div style={styles.userList}>
                      {filteredUsers.map((u) => (
                        <div
                          key={u.id || u._id}
                          className="user-item-row"
                          onClick={() => handleSelectUserToChat(u)}
                          style={styles.userCardRow}
                        >
                          <div style={styles.userAvatarContainer}>
                            <div style={styles.drawerUserAvatar}>
                              {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>

                          <div style={styles.userInfoCol}>
                            <div style={styles.userName}>{u.name || u.username || 'Campus User'}</div>
                            <div style={styles.userMetaSub}>
                              <span>{u.campus || 'Main Campus'}</span>
                            </div>
                          </div>

                          <button style={styles.chatActionBtn}>Chat</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* CHAT THREAD VIEW INSIDE DRAWER */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <button 
                  onClick={() => setActiveChatUser(null)} 
                  style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  ← Back to users
                </button>

                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {messagesLoading ? (
                    <ChatSkeleton />
                  ) : drawerMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>No messages yet. Say hi!</p>
                  ) : (
                    drawerMessages.map((msg, i) => {
                      const isMine = String(msg.sender_id || msg.senderId) === String(user?.id);
                      return (
                        <div key={i} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                          <div style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: '12px',
                            backgroundColor: isMine ? '#2563eb' : '#e2e8f0',
                            color: isMine ? '#ffffff' : '#0f172a',
                            fontSize: '0.875rem'
                          }}>
                            {msg.message || msg.messageText}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendDrawerMessage} style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={drawerInputMessage}
                    onChange={(e) => setDrawerInputMessage(e.target.value)}
                    placeholder={`Message ${activeChatUser.name || 'User'}...`}
                    style={{ flex: 1, padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  skeleton: {
    backgroundColor: '#e2e8f0',
    backgroundImage: 'linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px)',
    backgroundSize: '350px 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '6px',
  },
  pageWrapper: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: '6rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#0f172a',
  },
  container: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: '0.5rem',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '0.35rem 0.85rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
  },
  createCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
    animation: 'fadeIn 0.3s ease-out',
  },
  createHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  avatarPlaceholder: {
    width: '36px',
    height: '36px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
  },
  createTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  textarea: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: '1rem',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    maxHeight: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMedia: {
    maxHeight: '260px',
    width: '100%',
    objectFit: 'contain',
  },
  removeFileBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
  },
  formFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  inputGroup: {
    display: 'flex',
    gap: '0.5rem',
    flex: '1',
    minWidth: '240px',
  },
  input: {
    flex: '1',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
  },
  uploadLabel: {
    padding: '0.5rem 0.85rem',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
  },
  hiddenFileInput: {
    display: 'none',
  },
  primaryButton: {
    padding: '0.55rem 1.4rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.9rem',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: '3rem 1.5rem',
    borderRadius: '16px',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 2px 12px -2px rgba(15, 23, 42, 0.04)',
    border: '1px solid #e2e8f0',
    animation: 'fadeIn 0.25s ease-out',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.85rem',
  },
  authorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontWeight: '700',
    fontSize: '0.975rem',
    color: '#0f172a',
  },
  postMetaSub: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    color: '#64748b',
    marginTop: '0.1rem',
  },
  campusBadge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '0.15rem 0.5rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.725rem',
  },
  postContent: {
    fontSize: '0.975rem',
    lineHeight: '1.55',
    color: '#334155',
    marginBottom: '0.85rem',
    whiteSpace: 'pre-line',
  },
  mediaWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginBottom: '0.85rem',
    maxHeight: '420px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    maxHeight: '420px',
    objectFit: 'cover',
    display: 'block',
  },
  actionsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.65rem',
    borderTop: '1px solid #f1f5f9',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'none',
    border: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  commentsSection: {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px dashed #f1f5f9',
  },
  commentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  commentBubble: {
    backgroundColor: '#f8fafc',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    border: '1px solid #f1f5f9',
  },
  commentAuthor: {
    color: '#1e293b',
    marginRight: '0.4rem',
    cursor: 'pointer',
  },
  commentText: {
    color: '#334155',
  },
  commentForm: {
    display: 'flex',
    gap: '0.5rem',
  },
  commentInput: {
    flex: '1',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  commentSubmitBtn: {
    padding: '0.45rem 0.9rem',
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  floatingChatBtn: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: '#0353ffff',
    color: '#ffffff',
    padding: '0.55rem 1.0rem',
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.65rem',
    zIndex: 1000,
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 1100,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    width: '100%',
    maxWidth: '400px',
    height: '100%',
    backgroundColor: '#ffffff',
    boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  drawerHeader: {
    padding: '1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  drawerCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.25rem',
    cursor: 'pointer',
  },
  searchBarContainer: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  drawerBody: {
    padding: '0.5rem 0',
    flex: '1',
    overflowY: 'auto',
  },
  emptyUsersState: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
  },
  userCardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1.25rem',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
  },
  userAvatarContainer: {
    position: 'relative',
  },
  drawerUserAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoCol: {
    flex: '1',
  },
  userName: {
    fontWeight: '700',
    fontSize: '0.925rem',
    color: '#0f172a',
  },
  userMetaSub: {
    fontSize: '0.78rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    marginTop: '0.1rem',
  },
  chatActionBtn: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: 'none',
    padding: '0.35rem 0.85rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
};