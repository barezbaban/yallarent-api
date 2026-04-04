import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  fetchChatConversations, fetchChatConversation, fetchChatMessages,
  sendAgentMessage, updateConversation, fetchChatNotes, addChatNote,
  fetchCannedResponses, getToken, getAdmin,
} from '../api';
import {
  Search, Send, Paperclip, MoreVertical, Clock, User, Car, Calendar,
  ChevronDown, MessageSquare, AlertCircle, X, StickyNote, Hash,
  Circle, CheckCircle2, ArrowUpCircle, Loader2, Trash2, Edit3,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', cls: 'green' },
  { value: 'waiting_on_customer', label: 'Waiting on Customer', cls: 'amber' },
  { value: 'waiting_on_agent', label: 'Waiting on Agent', cls: 'blue' },
  { value: 'resolved', label: 'Resolved', cls: 'teal' },
  { value: 'closed', label: 'Closed', cls: 'red' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function statusPill(status) {
  const s = STATUS_OPTIONS.find(o => o.value === status) || { label: status, cls: 'amber' };
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

function priorityLabel(p) {
  const colors = { low: 'var(--text-muted)', normal: 'var(--text)', high: 'var(--amber)', urgent: 'var(--red)' };
  return <span style={{ color: colors[p] || 'var(--text)', fontWeight: 500, fontSize: 13 }}>{p?.charAt(0).toUpperCase() + p?.slice(1)}</span>;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Support() {
  const admin = getAdmin();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [convDetail, setConvDetail] = useState(null);
  const [customerContext, setCustomerContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [input, setInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typing, setTyping] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchFilter) params.search = searchFilter;
      const data = await fetchChatConversations(params);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchFilter]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Poll conversations as fallback for socket issues
  useEffect(() => {
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Poll messages for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await fetchChatMessages(selectedId);
        setMessages(msgs);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Socket.IO
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Connect to the same origin as the page, or use the API base for dev
    const socketUrl = window.location.origin;
    const socket = io(`${socketUrl}/chat-agent`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[Socket] Connected to /chat-agent'));
    socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err.message));

    socket.on('new_conversation', () => loadConversations());
    socket.on('conversation_updated', () => loadConversations());
    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      loadConversations();
    });
    socket.on('message_edited', (msg) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });
    socket.on('message_deleted', ({ id }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
    });
    socket.on('typing', (data) => {
      if (data.senderType === 'customer') setTyping(data);
    });
    socket.on('stop_typing', () => setTyping(null));

    return () => { socket.disconnect(); };
  }, [loadConversations]);

  // Join conversation room
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedId) return;
    socket.emit('join_conversation', selectedId);
    return () => { socket.emit('leave_conversation', selectedId); };
  }, [selectedId]);

  // Select conversation
  const selectConversation = async (id) => {
    setSelectedId(id);
    setMessages([]);
    setShowNotes(false);
    setShowCanned(false);
    try {
      const [detail, msgs, notesList, canned] = await Promise.all([
        fetchChatConversation(id),
        fetchChatMessages(id),
        fetchChatNotes(id),
        fetchCannedResponses(),
      ]);
      setConvDetail(detail.conversation);
      setCustomerContext(detail.customerContext);
      setMessages(msgs);
      setNotes(notesList);
      setCannedResponses(canned);
      loadConversations(); // refresh unread counts
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId) return;
    setInput('');
    try {
      const msg = await sendAgentMessage(selectedId, { content: text, messageType: 'text' });
      // Add immediately — socket will dedupe via id check
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', '');
      formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');
      const token = getToken();
      const res = await fetch(`/api/agent/chat/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const msg = await res.json();
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      loadConversations();
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
    e.target.value = '';
  };

  // Add note
  const handleAddNote = async () => {
    const text = noteInput.trim();
    if (!text || !selectedId) return;
    setNoteInput('');
    try {
      await addChatNote(selectedId, { content: text });
      const notesList = await fetchChatNotes(selectedId);
      setNotes(notesList);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  // Update conversation
  const handleUpdate = async (field, value) => {
    if (!selectedId) return;
    try {
      const updated = await updateConversation(selectedId, { [field]: value });
      setConvDetail(updated);
      loadConversations();
    } catch (err) {
      console.error('Failed to update conversation:', err);
    }
  };

  // Canned response insert
  const handleCannedSelect = (response) => {
    setInput(response.content);
    setShowCanned(false);
    inputRef.current?.focus();
  };

  // "/" shortcut detection
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/') && val.length > 1) {
      setShowCanned(true);
    } else if (!val.startsWith('/')) {
      setShowCanned(false);
    }
  };

  // Keyboard shortcut
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredCanned = showCanned && input.startsWith('/')
    ? cannedResponses.filter(c =>
        c.shortcut.toLowerCase().includes(input.toLowerCase()) ||
        c.title.toLowerCase().includes(input.slice(1).toLowerCase())
      )
    : cannedResponses;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="support-layout">
      {/* ─── Left Panel: Conversation List ─── */}
      <div className="support-list">
        <div className="support-list-header">
          <h2 className="support-list-title">Conversations</h2>
          <div className="support-list-filters">
            <div className="support-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <select
              className="support-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="support-list-items">
          {loading && <div className="support-empty">Loading...</div>}
          {!loading && conversations.length === 0 && (
            <div className="support-empty">No conversations found</div>
          )}
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`support-list-item ${selectedId === conv.id ? 'active' : ''}`}
              onClick={() => selectConversation(conv.id)}
            >
              <div className="support-item-top">
                <span className="support-item-name">{conv.customer_name}</span>
                <span className="support-item-time">{timeAgo(conv.last_message_at)}</span>
              </div>
              <div className="support-item-subject">{conv.subject || conv.category?.replace(/_/g, ' ')}</div>
              <div className="support-item-preview">{conv.last_message_preview || 'No messages yet'}</div>
              <div className="support-item-bottom">
                {statusPill(conv.status)}
                {conv.unread_count_agent > 0 && (
                  <span className="support-unread-badge">{conv.unread_count_agent}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Center Panel: Chat Thread ─── */}
      <div className="support-chat">
        {!selectedId ? (
          <div className="support-empty-chat">
            <MessageSquare size={48} strokeWidth={1} />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="support-chat-header">
              <div>
                <div className="support-chat-name">{convDetail?.customer_name}</div>
                <div className="support-chat-meta">
                  {convDetail?.subject || convDetail?.category?.replace(/_/g, ' ')}
                  {' · '}
                  {statusPill(convDetail?.status)}
                </div>
              </div>
              <div className="support-chat-actions">
                <button
                  className={`icon-btn ${showNotes ? 'active-icon' : ''}`}
                  title="Internal Notes"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <StickyNote size={18} />
                </button>
              </div>
            </div>

            {showNotes ? (
              <div className="support-notes-panel">
                <div className="support-notes-header">
                  <h3>Internal Notes</h3>
                  <button className="icon-btn" onClick={() => setShowNotes(false)}><X size={16} /></button>
                </div>
                <div className="support-notes-list">
                  {notes.length === 0 && <div className="support-empty" style={{ padding: 20 }}>No notes yet</div>}
                  {notes.map(note => (
                    <div key={note.id} className="support-note">
                      <div className="support-note-header">
                        <span className="support-note-agent">{note.agent_name}</span>
                        <span className="support-note-time">{timeAgo(note.created_at)}</span>
                      </div>
                      <div className="support-note-content">{note.content}</div>
                    </div>
                  ))}
                </div>
                <div className="support-notes-input">
                  <textarea
                    placeholder="Add an internal note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
                  />
                  <button className="btn-primary" style={{ padding: '8px 16px', width: 'auto' }} onClick={handleAddNote}>Add Note</button>
                </div>
              </div>
            ) : (
              <>
                <div className="support-messages">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="support-date-divider"><span>{date}</span></div>
                      {msgs.map(msg => (
                        <div
                          key={msg.id}
                          className={`support-msg ${msg.sender_type === 'agent' ? 'agent' : msg.sender_type === 'system' ? 'system' : 'customer'}`}
                        >
                          {msg.sender_type === 'system' ? (
                            <div className="support-system-msg">
                              <AlertCircle size={12} />
                              {msg.content}
                            </div>
                          ) : (
                            <div className={`support-msg-bubble ${msg.is_deleted ? 'deleted' : ''}`}>
                              <div className="support-msg-content">
                                {msg.message_type === 'image' && msg.file_url && !msg.is_deleted && (
                                  <img src={msg.file_url} alt="Attachment" className="support-msg-image" />
                                )}
                                {msg.message_type === 'file' && msg.file_url && !msg.is_deleted && (
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="support-msg-file">
                                    <Paperclip size={14} /> {msg.file_name || 'Download file'}
                                  </a>
                                )}
                                {msg.content && <p>{msg.content}</p>}
                              </div>
                              <div className="support-msg-time">
                                {formatTime(msg.created_at)}
                                {msg.edited_at && <span className="support-msg-edited">(edited)</span>}
                                {msg.sender_type === 'agent' && msg.is_read && <CheckCircle2 size={12} className="support-msg-read" />}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {typing && (
                    <div className="support-typing">
                      <Loader2 size={14} className="spin" /> Customer is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="support-input-area">
                  {showCanned && (
                    <div className="support-canned-dropdown">
                      {filteredCanned.length === 0 && <div className="support-canned-empty">No matching responses</div>}
                      {filteredCanned.map(c => (
                        <div key={c.id} className="support-canned-item" onClick={() => handleCannedSelect(c)}>
                          <span className="support-canned-shortcut">{c.shortcut}</span>
                          <span className="support-canned-title">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="support-input-row">
                    <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip size={18} />
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*,.pdf" onChange={handleFileUpload} />
                    <textarea
                      ref={inputRef}
                      className="support-input"
                      placeholder='Type a message... (use "/" for canned responses)'
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <button className="support-send-btn" onClick={handleSend} disabled={!input.trim()}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ─── Right Panel: Customer Context ─── */}
      <div className="support-context">
        {convDetail ? (
          <>
            <div className="support-context-section">
              <h3 className="support-context-title">Customer</h3>
              <div className="support-context-customer">
                <div className="support-context-avatar">
                  {convDetail.customer_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="support-context-name">{convDetail.customer_name}</div>
                  <div className="support-context-meta">{convDetail.customer_phone}</div>
                  <div className="support-context-meta">{convDetail.customer_city || 'No city'}</div>
                  <div className="support-context-meta">Customer since {formatDate(convDetail.customer_since)}</div>
                  {convDetail.customer_booking_count !== undefined && (
                    <div className="support-context-meta">{convDetail.customer_booking_count} bookings</div>
                  )}
                </div>
              </div>
            </div>

            <div className="support-context-section">
              <h3 className="support-context-title">Conversation</h3>
              <div className="support-context-field">
                <label>Status</label>
                <select
                  value={convDetail.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="support-context-select"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="support-context-field">
                <label>Priority</label>
                <select
                  value={convDetail.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                  className="support-context-select"
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="support-context-field">
                <label>Category</label>
                <span className="support-context-value">{convDetail.category?.replace(/_/g, ' ')}</span>
              </div>
              <div className="support-context-field">
                <label>Assigned</label>
                <span className="support-context-value">{convDetail.agent_name || 'Unassigned'}</span>
              </div>
            </div>

            {customerContext?.relatedBooking && (
              <div className="support-context-section">
                <h3 className="support-context-title">Related Booking</h3>
                <div className="support-context-booking">
                  <div className="support-booking-car">
                    {customerContext.relatedBooking.car_image && (
                      <img src={customerContext.relatedBooking.car_image} alt="" className="support-booking-img" />
                    )}
                    <span>{customerContext.relatedBooking.car_name}</span>
                  </div>
                  <div className="support-context-meta">
                    {formatDate(customerContext.relatedBooking.start_date)} - {formatDate(customerContext.relatedBooking.end_date)}
                  </div>
                  <div className="support-context-meta">
                    {Number(customerContext.relatedBooking.total_price).toLocaleString()} IQD · {statusPill(customerContext.relatedBooking.status)}
                  </div>
                </div>
              </div>
            )}

            {customerContext?.recentBookings?.length > 0 && (
              <div className="support-context-section">
                <h3 className="support-context-title">Recent Bookings</h3>
                {customerContext.recentBookings.map(b => (
                  <div key={b.id} className="support-context-booking-item">
                    <span className="support-context-value">{b.car_name}</span>
                    <span className="support-context-meta">{formatDate(b.start_date)} · {statusPill(b.status)}</span>
                  </div>
                ))}
              </div>
            )}

            {customerContext?.pastConversations?.length > 0 && (
              <div className="support-context-section">
                <h3 className="support-context-title">Past Conversations</h3>
                {customerContext.pastConversations.map(c => (
                  <div
                    key={c.id}
                    className="support-context-conv-item"
                    onClick={() => selectConversation(c.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="support-context-value">{c.subject || 'No subject'}</span>
                    <span className="support-context-meta">{formatDate(c.created_at)} · {statusPill(c.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="support-empty" style={{ padding: 24 }}>
            Select a conversation to see customer details
          </div>
        )}
      </div>
    </div>
  );
}
