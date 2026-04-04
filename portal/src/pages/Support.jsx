import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  fetchChatConversations, fetchChatConversation, fetchChatMessages,
  sendAgentMessage, updateConversation, fetchChatNotes, addChatNote,
  fetchCannedResponses, fetchConversationRating, getToken, getAdmin,
} from '../api';
import {
  Search, Send, Paperclip, MoreVertical, Clock, User, Car, Calendar,
  ChevronDown, MessageSquare, AlertCircle, X, StickyNote, Hash,
  Circle, CheckCircle2, ArrowUpCircle, Loader2, Trash2, Edit3, WifiOff,
  Star, Download, ZoomIn,
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
  const [socketConnected, setSocketConnected] = useState(false);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const [toast, setToast] = useState(null);
  const [imageModal, setImageModal] = useState(null); // { url, name }
  const [rating, setRating] = useState(null); // conversation rating
  const [pendingFile, setPendingFile] = useState(null); // { file, previewUrl, name, size, type }
  const [fileUploading, setFileUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  // Refs to avoid stale closures in socket handlers
  const selectedIdRef = useRef(selectedId);
  const conversationsRef = useRef(conversations);
  const messagesRef = useRef(messages);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Typing debounce refs
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Toast helper
  const showToast = useCallback((message, duration = 4000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  // Check if user is scrolled to bottom
  const isAtBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setShowNewMsgPill(false);
    }
  }, [isAtBottom]);

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

  // Reduced polling fallback — only when socket is disconnected
  useEffect(() => {
    if (socketConnected) return;
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations, socketConnected]);

  // Socket.IO — single connection, no dependency on loadConversations
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socketUrl = window.location.origin;
    const socket = io(`${socketUrl}/chat-agent`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to /chat-agent');
      setSocketConnected(true);
      // Re-join the active conversation room on reconnect
      const currentId = selectedIdRef.current;
      if (currentId) {
        socket.emit('join_conversation', currentId);
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setSocketConnected(false);
    });

    // ── New conversation from customer ──
    socket.on('new_conversation', (conv) => {
      setConversations(prev => {
        if (prev.some(c => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      showToast(`New conversation from ${conv.customer_name || 'a customer'}`);
    });

    // ── Conversation metadata updated ──
    socket.on('conversation_updated', (updated) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      });
      // If this is the selected conversation, update detail too
      if (updated.id === selectedIdRef.current) {
        setConvDetail(prev => prev ? { ...prev, ...updated } : prev);
      }
    });

    // ── New message ──
    socket.on('new_message', (msg) => {
      const currentSelectedId = selectedIdRef.current;
      const convId = msg.conversation_id;

      // Update conversation list inline: move to top, update preview, bump unread
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === convId);
        if (idx === -1) return prev; // conversation not in filtered list

        const conv = { ...prev[idx] };
        conv.last_message_preview = msg.content || msg.file_name || 'Attachment';
        conv.last_message_at = msg.created_at;

        // Only increment unread if this isn't the conversation we're viewing
        if (convId !== currentSelectedId && msg.sender_type === 'customer') {
          conv.unread_count_agent = (conv.unread_count_agent || 0) + 1;
        }

        const next = [...prev];
        next.splice(idx, 1);
        return [conv, ...next];
      });

      // If the message belongs to the active conversation, append it
      if (convId === currentSelectedId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Clear typing indicator for this conversation
        setTyping(null);
      }
    });

    // ── Message edited ──
    socket.on('message_edited', (msg) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });

    // ── Message deleted ──
    socket.on('message_deleted', ({ id }) => {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m
      ));
    });

    // ── Typing indicators ──
    socket.on('typing', (data) => {
      if (data.senderType === 'customer' && data.conversationId === selectedIdRef.current) {
        setTyping(data);
      }
    });

    socket.on('stop_typing', (data) => {
      if (data.senderType === 'customer' && data.conversationId === selectedIdRef.current) {
        setTyping(null);
      }
    });

    // ── Customer rated a conversation ──
    socket.on('conversation_rated', (data) => {
      const convId = data.conversation_id;

      // Update conversation list with rating badge
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, rating: data.rating } : c
      ));

      // If this conversation is currently open, update the sidebar rating
      if (convId === selectedIdRef.current) {
        setRating({
          rating: data.rating,
          feedback_text: data.feedback_text,
          created_at: data.rated_at,
        });
        // Insert a visual-only "rated" indicator as a system-style message in the UI
        setMessages(prev => [
          ...prev,
          {
            id: `rating-indicator-${Date.now()}`,
            conversation_id: convId,
            sender_type: 'system',
            content: `Customer rated this conversation ${'⭐'.repeat(data.rating)}`,
            created_at: data.rated_at,
            message_type: 'system_event',
            is_deleted: false,
          },
        ]);
      }

      // Toast for agents
      showToast(`${data.customer_name || 'Customer'} rated a conversation ⭐ ${data.rating}/5`);
    });

    // ── Customer closed conversation ──
    socket.on('conversation_closed', (data) => {
      setConversations(prev => prev.map(c =>
        c.id === data.conversationId ? { ...c, status: 'closed', closed_by: data.closedBy, closed_at: data.closedAt } : c
      ));
      if (data.conversationId === selectedIdRef.current) {
        setConvDetail(prev => prev ? { ...prev, status: 'closed', closed_by: data.closedBy, closed_at: data.closedAt } : prev);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // No deps — single connection for the lifetime of the component

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !selectedId) return;
    socket.emit('join_conversation', selectedId);
    return () => { socket.emit('leave_conversation', selectedId); };
  }, [selectedId]);

  // Select conversation
  const selectConversation = async (id) => {
    setSelectedId(id);
    setMessages([]);
    setShowNotes(false);
    setShowCanned(false);
    cancelPendingFile();
    setTyping(null);
    setShowNewMsgPill(false);
    setRating(null);
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

      // Fetch rating if conversation is closed
      if (detail.conversation.status === 'closed') {
        fetchConversationRating(id).then(r => setRating(r));
      }

      // Clear unread badge for this conversation
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, unread_count_agent: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  // Smart auto-scroll: scroll if at bottom, show pill if not
  useEffect(() => {
    if (messages.length === 0) return;
    if (isAtBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Check if the last message is from someone else (not the agent)
      const last = messages[messages.length - 1];
      if (last?.sender_type !== 'agent') {
        setShowNewMsgPill(true);
      }
    }
  }, [messages, isAtBottom]);

  // Auto mark-as-read when conversation is focused and we receive new messages
  useEffect(() => {
    if (!selectedId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.sender_type === 'customer' && isAtBottom()) {
      // Silently mark as read by fetching messages (which triggers server-side markRead)
      fetchChatMessages(selectedId).catch(() => {});
    }
  }, [selectedId, messages.length, isAtBottom]);

  // ── Agent typing emission ──
  const emitTyping = useCallback(() => {
    const socket = socketRef.current;
    const convId = selectedIdRef.current;
    if (!socket?.connected || !convId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId: convId });
    }

    // Reset the stop-typing timeout
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId: convId });
    }, 3000);
  }, []);

  const stopTyping = useCallback(() => {
    const socket = socketRef.current;
    const convId = selectedIdRef.current;
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket?.connected && convId) {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId: convId });
    }
  }, []);

  // Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId) return;
    setInput('');
    stopTyping();
    try {
      const msg = await sendAgentMessage(selectedId, { content: text, messageType: 'text' });
      // Optimistic add — socket will dedupe via id check
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      // Update conversation list preview
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === selectedId);
        if (idx === -1) return prev;
        const conv = { ...prev[idx], last_message_preview: text, last_message_at: msg.created_at };
        const next = [...prev];
        next.splice(idx, 1);
        return [conv, ...next];
      });
      // Force scroll to bottom after sending
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // File select → preview
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    e.target.value = '';

    // Validate type
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setToast({ type: 'error', message: 'Only JPG, PNG, and PDF files are allowed.' });
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File must be under 5 MB.' });
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, name: file.name, size: file.size, type: file.type });
  };

  const handleSendFile = async () => {
    if (!pendingFile || !selectedId || fileUploading) return;
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile.file);
      formData.append('content', '');
      formData.append('messageType', pendingFile.type.startsWith('image/') ? 'image' : 'file');
      const token = getToken();
      const res = await fetch(`/api/agent/chat/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const msg = await res.json();
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      setPendingFile(null);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setToast({ type: 'error', message: 'Failed to upload file.' });
    }
    setFileUploading(false);
  };

  const cancelPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
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
      setConversations(prev => prev.map(c =>
        c.id === selectedId ? { ...c, ...updated } : c
      ));
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

  // "/" shortcut detection + typing emission
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith('/') && val.length > 1) {
      setShowCanned(true);
    } else if (!val.startsWith('/')) {
      setShowCanned(false);
    }
    // Emit typing indicator
    if (val.trim()) {
      emitTyping();
    } else {
      stopTyping();
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
      {/* ─── Reconnection Banner ─── */}
      {!socketConnected && (
        <div className="support-reconnect-banner">
          <WifiOff size={14} />
          <span>Reconnecting to live updates...</span>
          <Loader2 size={14} className="spin" />
        </div>
      )}

      {/* ─── Toast Notification ─── */}
      {toast && (
        <div className="support-toast">
          <MessageSquare size={14} />
          <span>{toast}</span>
          <button className="icon-btn" onClick={() => setToast(null)} style={{ marginLeft: 8, padding: 2 }}>
            <X size={12} />
          </button>
        </div>
      )}

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
                {conv.rating && (
                  <span className="support-item-rating">
                    <Star size={11} fill="#F59E0B" stroke="#F59E0B" /> {conv.rating}
                  </span>
                )}
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
                <div className="support-messages" ref={messagesContainerRef}>
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
                                  <div
                                    className="support-msg-image-wrap"
                                    onClick={() => setImageModal({ url: msg.file_url, name: msg.file_name || 'image' })}
                                  >
                                    <img src={msg.file_url} alt="Attachment" className="support-msg-image" />
                                    <div className="support-msg-image-overlay">
                                      <ZoomIn size={18} />
                                    </div>
                                  </div>
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

                {/* New message pill */}
                {showNewMsgPill && (
                  <div className="support-new-msg-pill" onClick={() => scrollToBottom(true)}>
                    <ChevronDown size={14} /> New message
                  </div>
                )}

                {convDetail?.status === 'closed' ? (
                  <div className="support-closed-banner">
                    <AlertCircle size={14} />
                    <span>
                      This conversation was closed
                      {convDetail.closed_by === 'customer' ? ' by the customer' : ' by an agent'}
                      {convDetail.closed_at && ` on ${formatDate(convDetail.closed_at)}`}
                    </span>
                  </div>
                ) : (
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
                    {pendingFile && (
                      <div className="support-file-preview">
                        {pendingFile.previewUrl ? (
                          <img src={pendingFile.previewUrl} alt="Preview" className="support-file-preview-img" />
                        ) : (
                          <div className="support-file-preview-icon"><Paperclip size={20} /></div>
                        )}
                        <div className="support-file-preview-info">
                          <span className="support-file-preview-name">{pendingFile.name}</span>
                          <span className="support-file-preview-size">{(pendingFile.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <button className="support-file-preview-cancel" onClick={cancelPendingFile} title="Cancel">
                          <X size={16} />
                        </button>
                        <button className="support-file-preview-send" onClick={handleSendFile} disabled={fileUploading}>
                          {fileUploading ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    )}
                    <div className="support-input-row">
                      <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip size={18} />
                      </button>
                      <input type="file" ref={fileInputRef} hidden accept="image/jpeg,image/png,application/pdf" onChange={handleFileUpload} />
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
                )}
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
              {convDetail.status === 'closed' && convDetail.closed_by && (
                <div className="support-context-field">
                  <label>Closed by</label>
                  <span className="support-context-value">
                    {convDetail.closed_by === 'customer' ? 'Customer' : 'Agent'}
                    {convDetail.closed_at && ` · ${formatDate(convDetail.closed_at)}`}
                  </span>
                </div>
              )}
            </div>

            {rating && (
              <div className="support-context-section">
                <h3 className="support-context-title">Customer Feedback</h3>
                <div className="support-rating-display">
                  <div className="support-rating-stars">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={18} fill={s <= rating.rating ? '#F59E0B' : 'none'} stroke={s <= rating.rating ? '#F59E0B' : '#CBD5E1'} />
                    ))}
                    <span className="support-rating-number">{rating.rating}/5</span>
                  </div>
                  {rating.feedback_text && (
                    <div className="support-rating-feedback-card">{rating.feedback_text}</div>
                  )}
                  <div className="support-context-meta" style={{ marginTop: 6 }}>{timeAgo(rating.created_at)}</div>
                </div>
              </div>
            )}

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

      {/* ─── Image Modal ─── */}
      {imageModal && (
        <div className="support-image-modal-overlay" onClick={() => setImageModal(null)}>
          <div className="support-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="support-image-modal-header">
              <span className="support-image-modal-name">{imageModal.name}</span>
              <div className="support-image-modal-actions">
                <a href={imageModal.url} download={imageModal.name} className="icon-btn" title="Download">
                  <Download size={18} />
                </a>
                <button className="icon-btn" onClick={() => setImageModal(null)} title="Close">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="support-image-modal-body">
              <img src={imageModal.url} alt={imageModal.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
