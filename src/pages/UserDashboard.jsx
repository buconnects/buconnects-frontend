import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import SocialFeed from './../components/SocialFeed';
import ConversationList from './../components/ConversationList';
import Chat from './../components/Chat';
import { useAuth } from './../context/AuthContext';
import apiClient from '../services/apiClient'; 
import { Rss, ShoppingBag, Megaphone, Calendar, Home, MessageSquare, User, Settings, LogOut, Menu, X, Bell } from 'lucide-react';
import './Dashboard.css';
import Navbar from '../components/Navbar';
import SettingsPage from './Settings';
import Profile from './Profile';
import { useLocation, useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  
  const { user, logout, updateUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('social');
  const canManageCampusContent = ['ADMIN', 'DEVELOPER'].includes(user?.role || 'USER');

  // Dynamic state & Loading indicators
  const [marketItems, setMarketItems] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(false);

  const [campusUpdates, setCampusUpdates] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const [campusEvents, setCampusEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [hostelListings, setHostelListings] = useState([]);
  const [loadingHostels, setLoadingHostels] = useState(false);

  // Toast notification on login
  useEffect(() => {
    if (location.state?.showLoginToast) {
      setShowToast(true);

      navigate(location.pathname, { replace: true, state: {} });

      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Form States
  const [marketForm, setMarketForm] = useState({
    title: '',
    category: 'Electronics',
    price: '',
    condition: 'New',
    campus: 'Main Campus',
    seller: '',
    contact: '',
    description: ''
  });

  const [updateForm, setUpdateForm] = useState({
    title: '',
    category: 'Academic',
    audience: 'All students',
    priority: 'Medium',
    summary: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    category: 'Workshop',
    host: '',
    capacity: '',
    description: ''
  });

  const [hostelForm, setHostelForm] = useState({
    name: '',
    location: '',
    price_range: '',
    amenities: 'Wi-Fi, Water, Security',
    contact_phone: '',
    description: '',
    cover_image: ''
  });

  // API Data Fetching Handlers with Loading State
  const fetchMarketItems = async () => {
    setLoadingMarket(true);
    try {
      const data = await apiClient('/marketplace');
      setMarketItems(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      console.error('Failed to fetch marketplace items:', error.message);
    } finally {
      setLoadingMarket(false);
    }
  };

  const fetchCampusUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const data = await apiClient('/updates');
      setCampusUpdates(Array.isArray(data) ? data : data?.updates || []);
    } catch (error) {
      console.error('Failed to fetch campus updates:', error.message);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const fetchCampusEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await apiClient('/events');
      setCampusEvents(Array.isArray(data) ? data : data?.events || []);
    } catch (error) {
      console.error('Failed to fetch campus events:', error.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchHostels = async () => {
    setLoadingHostels(true);
    try {
      const data = await apiClient('/hostels');
      setHostelListings(Array.isArray(data) ? data : data?.hostels || []);
    } catch (error) {
      console.error('Failed to fetch hostels:', error.message);
    } finally {
      setLoadingHostels(false);
    }
  };

  // Synchronize Tab selection with backend calls
  useEffect(() => {
    if (activeTab === 'market') fetchMarketItems();
    if (activeTab === 'updates') fetchCampusUpdates();
    if (activeTab === 'events') fetchCampusEvents();
    if (activeTab === 'hostels') fetchHostels();
  }, [activeTab]);

  // API Form Submissions
  const handleCreateMarket = async (event) => {
    event.preventDefault();
    if (!canManageCampusContent) return;

    try {
      const numericPrice = parseFloat(marketForm.price.replace(/[^0-9.]/g, '')) || 0;
      const payload = {
        title: marketForm.title,
        category: marketForm.category,
        price: numericPrice,
        condition: marketForm.condition,
        campus: marketForm.campus,
        seller: marketForm.seller || user?.full_name || user?.name || 'Administrator',
        contact: marketForm.contact,
        description: marketForm.description
      };

      const response = await apiClient('/marketplace', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newItem = response.item || response;
      setMarketItems((previous) => [newItem, ...previous]);
      setMarketForm({
        title: '',
        category: 'Electronics',
        price: '',
        condition: 'New',
        campus: 'Main Campus',
        seller: '',
        contact: '',
        description: ''
      });
    } catch (error) {
      console.error('Failed to publish market item:', error.message);
      alert(error.message || 'Failed to post listing');
    }
  };

  const handleCreateUpdate = async (event) => {
    event.preventDefault();
    if (!canManageCampusContent) return;

    try {
      const payload = {
        title: updateForm.title,
        category: updateForm.category,
        audience: updateForm.audience,
        priority: updateForm.priority,
        summary: updateForm.summary
      };

      const response = await apiClient('/updates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newUpdate = response.update || response;
      setCampusUpdates((previous) => [newUpdate, ...previous]);
      setUpdateForm({
        title: '',
        category: 'Academic',
        audience: 'All students',
        priority: 'Medium',
        summary: ''
      });
    } catch (error) {
      console.error('Failed to publish campus update:', error.message);
      alert(error.message || 'Failed to publish update');
    }
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    if (!canManageCampusContent) return;

    try {
      const payload = {
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time,
        venue: eventForm.venue,
        category: eventForm.category,
        host: eventForm.host || user?.full_name || user?.name || 'Campus Office',
        capacity: eventForm.capacity || 'Open',
        description: eventForm.description,
        status: 'Open for registration'
      };

      const response = await apiClient('/events', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newEvent = response.event || response;
      setCampusEvents((previous) => [newEvent, ...previous]);
      setEventForm({
        title: '',
        date: '',
        time: '',
        venue: '',
        category: 'Workshop',
        host: '',
        capacity: '',
        description: ''
      });
    } catch (error) {
      console.error('Failed to create event:', error.message);
      alert(error.message || 'Failed to create event');
    }
  };

  const handleCreateHostel = async (event) => {
    event.preventDefault();
    if (!canManageCampusContent) return;

    try {
      const amenitiesArray = hostelForm.amenities.split(',').map((item) => item.trim()).filter(Boolean);
      const payload = {
        name: hostelForm.name,
        location: hostelForm.location,
        price_range: hostelForm.price_range,
        amenities: amenitiesArray,
        contact_phone: hostelForm.contact_phone,
        description: hostelForm.description,
        cover_image: hostelForm.cover_image
      };

      const response = await apiClient('/hostels', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newHostel = response.hostel || response;
      setHostelListings((previous) => [newHostel, ...previous]);
      setHostelForm({
        name: '',
        location: '',
        price_range: '',
        amenities: 'Wi-Fi, Water, Security',
        contact_phone: '',
        description: '',
        cover_image: ''
      });
    } catch (error) {
      console.error('Failed to add hostel listing:', error.message);
      alert(error.message || 'Failed to add hostel');
    }
  };

  useEffect(() => {
    const returnToDashboardHome = () => {
      setActiveTab('social');
      setSelectedUser(null);
    };

    window.addEventListener('dashboard-back', returnToDashboardHome);
    return () => window.removeEventListener('dashboard-back', returnToDashboardHome);
  }, []);

  // Notification & Real-time State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const navItems = [
    { id: 'market', label: 'Market', icon: ShoppingBag },
    { id: 'updates', label: 'Campus Updates', icon: Megaphone },
    { id: 'social', label: 'Social Feed', icon: Rss },
    { id: 'events', label: 'Campus Events', icon: Calendar },
    { id: 'hostels', label: 'Hostels', icon: Home },
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const playNotificationTone = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.04;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    } catch (error) {
      console.warn('Notification sound unavailable:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return undefined;
    const notificationSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    notificationSocket.emit('register_user', user.id);
    notificationSocket.on('new_notification', (notification) => {
      setNotifications((previous) => [{ ...notification, id: `${Date.now()}-${notification.type}` }, ...previous]);
      setUnreadCount((count) => count + 1);
      playNotificationTone();
    });

    const refreshNotifications = async () => {
      try {
        const data = await apiClient('/notifications');
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((item) => !item.isRead && !item.is_read).length);
        }
      } catch (error) {
        console.error('Failed to refresh notifications:', error);
      }
    };

    const refreshTimer = window.setInterval(refreshNotifications, 15000);
    return () => {
      window.clearInterval(refreshTimer);
      notificationSocket.disconnect();
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
        const unread = data.filter((n) => !n.isRead && !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.log('Failed to fetch notifications:', err.message);
      setUnreadCount(0);
    }
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, is_read: true })));

    apiClient('/notifications/mark-read', { method: 'POST' }).catch(() => {});
  };

  const handleStartChat = (targetUser) => {
    setSelectedUser(targetUser);
    setActiveTab('chats');
  };

  const handleInquireEntity = (targetId, targetName) => {
    if (!targetId) {
      alert('Contact information for chat inquiry is not available.');
      return;
    }

    if (targetId === user?.id) {
      alert('You cannot initiate an inquiry chat with yourself.');
      return;
    }

    handleStartChat({
      id: targetId,
      name: targetName
    });
  };

  // SKELETON LOADERS
  const renderSkeletons = (count = 3, hasImage = false) => {
    return Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="skeleton-card">
        {hasImage && <div className="skeleton-box" style={{ width: '100%', height: '180px' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton-box" style={{ width: '80px', height: '22px' }} />
          <div className="skeleton-box" style={{ width: '70px', height: '22px' }} />
        </div>
        <div className="skeleton-box" style={{ width: '60%', height: '24px', marginTop: '6px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '14px', marginTop: '6px' }} />
        <div className="skeleton-box" style={{ width: '85%', height: '14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
          <div className="skeleton-box" style={{ width: '40%', height: '16px' }} />
          <div className="skeleton-box" style={{ width: '70px', height: '28px' }} />
        </div>
      </div>
    ));
  };

  return (
    <div className="dashboard-layout">
      {showToast && (
        <div className="login-toast">
          <div className="toast-content">
            <div className="toast-icon-check">✓</div>
            <span className="toast-text">Login successful</span>
          </div>
          <button onClick={() => setShowToast(false)} className="toast-close-btn">×</button>
        </div>
      )}

      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="brand-logo">buCONNECTS</h2>
        <div className="mobile-header-actions">
          <button
            className={`icon-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('chats');
              setSelectedUser(null);
              setSidebarOpen(false);
            }}
            title="Open chats"
          >
            <MessageSquare size={21} />
            {unreadMessagesCount > 0 && (
              <span className="mobile-chat-badge">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </button>
          <button 
            className="icon-btn notification-trigger-btn" 
            onClick={handleOpenNotifications}
            style={{ position: 'relative' }}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: '800',
                borderRadius: '10px',
                padding: '0.15rem 0.35rem',
                lineHeight: 1
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2 className="brand-logo">buCONNECTS</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="sidebar-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar-small">
              {user?.avatar_url || user?.avatarUrl ? (
                <img src={user.avatar_url || user.avatarUrl} alt="Your profile" />
              ) : (
                (user?.name || user?.full_name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || user?.full_name || 'User'}</span>
              <span className="user-role">{user?.email || ''}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="dashboard-main">
        <Navbar
          onOpenChats={() => setActiveTab('chats')}
          unreadCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
        />

        {/* Tab 1: Social Feed */}
        {activeTab === 'social' && (
          <div className="tab-view-container">
            <SocialFeed onStartChat={handleStartChat} />
          </div>
        )}

        {/* Tab 2: Messaging Workspace */}
        {activeTab === 'chats' && (
          <div className={`chats-workspace-grid ${selectedUser ? 'chat-selected' : ''}`}>
            <ConversationList
              currentUserId={user?.id}
              activeTargetId={selectedUser?.id}
              onSelectUser={(contact) => setSelectedUser(contact)}
              onUnreadCountChange={setUnreadMessagesCount}
            />

            <div className="chat-window-pane">
              {selectedUser ? (
                <Chat
                  currentUserId={user?.id}
                  currentUserName={user?.name}
                  targetUserId={selectedUser.id}
                  targetUserName={selectedUser.name}
                  targetUserAvatar={selectedUser.avatar_url || selectedUser.avatarUrl}
                  onBack={() => setSelectedUser(null)}
                />
              ) : (
                <div className="no-chat-selected">
                  <MessageSquare size={48} className="placeholder-icon" />
                  <h3>Your Messages</h3>
                  <p>Select a contact from the list on the left to start chatting.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Market */}
        {activeTab === 'market' && (
          <div className="tab-view-container module-shell market-shell">
            <div className="module-header">
              <div>
                <p className="module-kicker">Campus exchange</p>
                <h3>Campus Market</h3>
              </div>
            </div>

            <div className="module-grid">
              <div className="module-list">
                {loadingMarket ? (
                  renderSkeletons(3)
                ) : marketItems.length === 0 ? (
                  <p className="no-data-msg">Loading took much time, refresh the browser to load market items</p>
                ) : (
                  marketItems.map((item) => (
                    <article key={item.id || item.item_id} className="listing-card market-card">
                      <div className="listing-topline">
                        <span className="category-pill">{item.category}</span>
                        <span className="price-tag">
                          {typeof item.price === 'number' ? `UGX ${item.price.toLocaleString()}` : item.price}
                        </span>
                      </div>
                      <h4>{item.title}</h4>
                      <div className="meta-row">
                        <span>{item.condition || item.status || 'Available'}</span>
                        <span>{item.campus || 'Main Campus'}</span>
                      </div>
                      <p className="description">{item.description}</p>
                      <div className="seller-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div>
                          <strong>{item.seller || item.seller_name || 'Campus Member'}</strong>
                          {item.contact && <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>{item.contact}</span>}
                        </div>
                        <button
                          type="button"
                          className="primary-button market-inquire-btn"
                          onClick={() => handleInquireEntity(item.seller_id || item.user_id || item.created_by, item.seller || item.seller_name || 'Seller')}
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                          }}
                        >
                          <MessageSquare size={14} />
                          Inquire
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {canManageCampusContent && (
                <form className="form-panel" onSubmit={handleCreateMarket}>
                  <h4>List a new item</h4>
                  <div className="field-grid">
                    <input value={marketForm.title} onChange={(e) => setMarketForm({ ...marketForm, title: e.target.value })} placeholder="Item title" required />
                    <select value={marketForm.category} onChange={(e) => setMarketForm({ ...marketForm, category: e.target.value })}>
                      <option>Electronics</option>
                      <option>Home & Living</option>
                      <option>Books</option>
                      <option>Fashion</option>
                      <option>Services</option>
                    </select>
                    <input value={marketForm.price} onChange={(e) => setMarketForm({ ...marketForm, price: e.target.value })} placeholder="Price e.g. 250000" required />
                    <select value={marketForm.condition} onChange={(e) => setMarketForm({ ...marketForm, condition: e.target.value })}>
                      <option>New</option>
                      <option>Excellent</option>
                      <option>Used</option>
                      <option>Fair</option>
                    </select>
                    <input value={marketForm.campus} onChange={(e) => setMarketForm({ ...marketForm, campus: e.target.value })} placeholder="Campus/location" required />
                    <input value={marketForm.seller} onChange={(e) => setMarketForm({ ...marketForm, seller: e.target.value })} placeholder="Seller name" />
                    <input value={marketForm.contact} onChange={(e) => setMarketForm({ ...marketForm, contact: e.target.value })} placeholder="Contact number" required />
                    <textarea value={marketForm.description} onChange={(e) => setMarketForm({ ...marketForm, description: e.target.value })} placeholder="Item details" rows="4" required />
                  </div>
                  <button type="submit" className="primary-button market-button">Publish listing</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Updates */}
        {activeTab === 'updates' && (
          <div className="tab-view-container module-shell update-shell">
            <div className="module-header">
              <div>
                <p className="module-kicker">Information desk</p>
                <h3>Campus Updates</h3>
              </div>
            </div>

            <div className="module-grid">
              <div className="module-list">
                {loadingUpdates ? (
                  renderSkeletons(3)
                ) : campusUpdates.length === 0 ? (
                  <p className="no-data-msg">Loading updates failed, refresh the browser to load updates</p>
                ) : (
                  campusUpdates.map((item) => (
                    <article key={item.id} className="listing-card update-card">
                      <div className="listing-topline">
                        <span className="category-pill update-pill">{item.category}</span>
                        <span className={`priority-badge ${(item.priority || 'medium').toLowerCase()}`}>{item.priority}</span>
                      </div>
                      <h4>{item.title}</h4>
                      <div className="meta-row">
                        <span>Audience: {item.audience || 'All students'}</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <p className="description">{item.summary}</p>
                    </article>
                  ))
                )}
              </div>

              {canManageCampusContent && (
                <form className="form-panel" onSubmit={handleCreateUpdate}>
                  <h4>Share a campus update</h4>
                  <div className="field-grid">
                    <input value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} placeholder="Update title" required />
                    <select value={updateForm.category} onChange={(e) => setUpdateForm({ ...updateForm, category: e.target.value })}>
                      <option>Academic</option>
                      <option>Campus Services</option>
                      <option>Health & Safety</option>
                      <option>Finance</option>
                      <option>General</option>
                    </select>
                    <select value={updateForm.audience} onChange={(e) => setUpdateForm({ ...updateForm, audience: e.target.value })}>
                      <option>All students</option>
                      <option>Freshers</option>
                      <option>Final years</option>
                      <option>Faculty staff</option>
                    </select>
                    <select value={updateForm.priority} onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                    <textarea value={updateForm.summary} onChange={(e) => setUpdateForm({ ...updateForm, summary: e.target.value })} rows="5" placeholder="Write the update details" required />
                  </div>
                  <button type="submit" className="primary-button update-button">Submit update</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Events */}
        {activeTab === 'events' && (
          <div className="tab-view-container module-shell event-shell">
            <div className="module-header">
              <div>
                <p className="module-kicker">Campus calendar</p>
                <h3>Campus Events</h3>
              </div>
            </div>

            <div className="module-grid">
              <div className="module-list">
                {loadingEvents ? (
                  renderSkeletons(3)
                ) : campusEvents.length === 0 ? (
                  <p className="no-data-msg">No upcoming events listed.</p>
                ) : (
                  campusEvents.map((item) => (
                    <article key={item.id} className="listing-card event-card">
                      <div className="listing-topline">
                        <span className="category-pill event-pill">{item.category}</span>
                        <span className="status-pill">{item.status || 'Open'}</span>
                      </div>
                      <h4>{item.title}</h4>
                      <div className="event-meta">
                        <span>{item.date}</span>
                        <span>{item.time}</span>
                      </div>
                      <div className="event-meta">
                        <span>Venue: {item.venue}</span>
                        {item.capacity && <span>Capacity: {item.capacity}</span>}
                      </div>
                      <p className="description">{item.description}</p>
                      <div className="seller-row">
                        <div>
                          <strong>Host: {item.host || 'Campus Office'}</strong>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {canManageCampusContent && (
                <form className="form-panel" onSubmit={handleCreateEvent}>
                  <h4>Create a campus event</h4>
                  <div className="field-grid">
                    <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" required />
                    <select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                      <option>Workshop</option>
                      <option>Seminar</option>
                      <option>Sports</option>
                      <option>Innovation</option>
                      <option>Festival</option>
                    </select>
                    <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required />
                    <input value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} placeholder="Time e.g. 2:00 PM - 5:00 PM" required />
                    <input value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Venue" required />
                    <input value={eventForm.host} onChange={(e) => setEventForm({ ...eventForm, host: e.target.value })} placeholder="Host / organizing office" />
                    <input value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })} placeholder="Capacity / seats" />
                    <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows="4" placeholder="Event description" required />
                  </div>
                  <button type="submit" className="primary-button event-button">Publish event</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Hostels Workspace */}
        {activeTab === 'hostels' && (
          <div className="tab-view-container module-shell hostel-shell">
            <div className="module-header">
              <div>
                <p className="module-kicker">Student Accommodation</p>
                <h3>Campus Hostels & Rentals</h3>
              </div>
            </div>

            <div className="module-grid">
              <div className="module-list">
                {loadingHostels ? (
                  renderSkeletons(3, true)
                ) : hostelListings.length === 0 ? (
                  <p className="no-data-msg">No hostel listings available.</p>
                ) : (
                  hostelListings.map((item) => {
                    const parsedAmenities = typeof item.amenities === 'string' 
                      ? JSON.parse(item.amenities || '[]') 
                      : (item.amenities || []);

                    return (
                      <article key={item.id} className="listing-card hostel-card">
                        {item.cover_image && (
                          <img 
                            src={item.cover_image} 
                            alt={item.name} 
                            style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }} 
                          />
                        )}
                        <div className="listing-topline">
                          <span className="category-pill">{item.location}</span>
                          <span className="price-tag">{item.price_range}</span>
                        </div>
                        <h4>{item.name}</h4>
                        <p className="description">{item.description}</p>

                        {parsedAmenities.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                            {parsedAmenities.map((amenity, idx) => (
                              <span key={idx} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="seller-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div>
                            <strong>Contact: {item.contact_phone || 'Direct line'}</strong>
                          </div>
                          <button
                            type="button"
                            className="primary-button hostel-inquire-btn"
                            onClick={() => handleInquireEntity(item.created_by, item.name)}
                            style={{
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              cursor: 'pointer'
                            }}
                          >
                            <MessageSquare size={14} />
                            Inquire
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {canManageCampusContent && (
                <form className="form-panel" onSubmit={handleCreateHostel}>
                  <h4>List a new hostel</h4>
                  <div className="field-grid">
                    <input value={hostelForm.name} onChange={(e) => setHostelForm({ ...hostelForm, name: e.target.value })} placeholder="Hostel / Building Name" required />
                    <input value={hostelForm.location} onChange={(e) => setHostelForm({ ...hostelForm, location: e.target.value })} placeholder="Location e.g. Main Gate, Busitema" required />
                    <input value={hostelForm.price_range} onChange={(e) => setHostelForm({ ...hostelForm, price_range: e.target.value })} placeholder="Price e.g. UGX 450,000 / Semester" required />
                    <input value={hostelForm.contact_phone} onChange={(e) => setHostelForm({ ...hostelForm, contact_phone: e.target.value })} placeholder="Contact Phone Number" required />
                    <input value={hostelForm.amenities} onChange={(e) => setHostelForm({ ...hostelForm, amenities: e.target.value })} placeholder="Amenities (comma separated)" />
                    <input value={hostelForm.cover_image} onChange={(e) => setHostelForm({ ...hostelForm, cover_image: e.target.value })} placeholder="Cover Image URL (optional)" />
                    <textarea value={hostelForm.description} onChange={(e) => setHostelForm({ ...hostelForm, description: e.target.value })} rows="4" placeholder="Detailed hostel description & room types" required />
                  </div>
                  <button type="submit" className="primary-button hostel-button">Publish Hostel</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Profile & Settings Views */}
        {activeTab === 'profile' && (
          <div className="tab-view-container profile-tab-view">
            <Profile onProfileUpdated={(updatedProfile) => updateUser({
              name: updatedProfile.fullName,
              full_name: updatedProfile.fullName,
              email: updatedProfile.email,
              campus: updatedProfile.campus,
              phone_number: updatedProfile.phoneNumber,
              avatar_url: updatedProfile.avatarUrl,
              avatarUrl: updatedProfile.avatarUrl,
            })} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="tab-view-container settings-tab-view">
            <SettingsPage embedded />
          </div>
        )}
      </main>

      {/* Notification Modal */}
      {isNotificationsOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 1200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '4rem',
          }}
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div 
            style={{
              width: '90%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Notifications</h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    gap: '0.85rem',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid #f8fafc',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      💬
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a' }}>
                        {item.title || 'Campus Activity'}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.15rem' }}>
                        {item.message || item.content}
                      </div>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                        {new Date(item.createdAt || item.created_at || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}