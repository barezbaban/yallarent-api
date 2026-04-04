import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { ChatConversation, ChatMessage, chatApi } from '../services/api';
import { useSocket } from '../services/socket';

const CATEGORIES = [
  { value: 'general_inquiry', label: 'General Inquiry', icon: 'help-circle-outline' as const },
  { value: 'booking_issue', label: 'Booking Issue', icon: 'calendar-outline' as const },
  { value: 'payment_issue', label: 'Payment Issue', icon: 'card-outline' as const },
  { value: 'car_problem', label: 'Car Problem', icon: 'car-outline' as const },
  { value: 'account_issue', label: 'Account Issue', icon: 'person-outline' as const },
  { value: 'complaint', label: 'Complaint', icon: 'warning-outline' as const },
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

type Screen = 'list' | 'new' | 'thread';

// Message status for customer-sent messages
type MsgStatus = 'sending' | 'sent' | 'read' | 'failed';

export default function SupportChatScreen() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const [screen, setScreen] = useState<Screen>('list');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newCategory, setNewCategory] = useState('general_inquiry');
  const [newSubject, setNewSubject] = useState('');
  const [typing, setTyping] = useState(false);
  const [showNewMsgPill, setShowNewMsgPill] = useState(false);
  const [msgStatuses, setMsgStatuses] = useState<Record<string, MsgStatus>>({});
  const flatListRef = useRef<FlatList>(null);

  // Refs to avoid stale closures in socket handlers
  const selectedConvIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<ChatConversation[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isAtBottomRef = useRef(true);
  const screenRef = useRef<Screen>('list');

  // Typing debounce refs
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await chatApi.getMessages(convId);
      setMessages(msgs);
    } catch (err: any) {
      Alert.alert('Load Error', err.message || 'Failed to load messages');
    }
  }, []);

  // ── Socket.IO event handlers ──
  useEffect(() => {
    if (!socket) return;

    // Join rooms for all conversations on connect
    const joinAllRooms = () => {
      const convs = conversationsRef.current;
      convs.forEach(c => socket.emit('join_conversation', c.id));
    };

    // Join rooms when conversations load or socket connects
    if (socket.connected) {
      joinAllRooms();
    }
    socket.on('connect', joinAllRooms);

    // ── New message from agent ──
    const handleNewMessage = (msg: ChatMessage) => {
      const convId = msg.conversation_id;
      const currentConvId = selectedConvIdRef.current;
      const currentScreen = screenRef.current;

      // Update conversation list inline
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === convId);
        if (idx === -1) return prev;

        const conv = { ...prev[idx] };
        conv.last_message_preview = msg.content || msg.file_name || 'Attachment';
        conv.last_message_at = msg.created_at;

        // Only increment unread if not actively viewing this conversation
        if (!(currentScreen === 'thread' && convId === currentConvId) && msg.sender_type === 'agent') {
          conv.unread_count_customer = (conv.unread_count_customer || 0) + 1;
        }

        const next = [...prev];
        next.splice(idx, 1);
        return [conv, ...next];
      });

      // If this message belongs to the active chat thread, append it
      if (currentScreen === 'thread' && convId === currentConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Clear typing indicator
        setTyping(false);
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }

        // Mark as read via REST (server marks agent messages as read)
        chatApi.getMessages(convId, { limit: 1 }).catch(() => {});
      }
    };

    // ── Conversation updated (status change, etc.) ──
    const handleConversationUpdated = (updated: Partial<ChatConversation> & { id: string }) => {
      setConversations(prev =>
        prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
      );
    };

    // ── Message read receipt (agent read our message) ──
    const handleMessageRead = (data: { conversationId: string; messageIds?: string[] }) => {
      if (data.conversationId === selectedConvIdRef.current) {
        // Mark all customer messages as read
        setMsgStatuses(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(id => {
            if (next[id] === 'sent') next[id] = 'read';
          });
          return next;
        });
      }
    };

    // ── Typing indicators ──
    const handleTyping = (data: { conversationId: string; senderType: string }) => {
      if (data.senderType === 'agent' && data.conversationId === selectedConvIdRef.current) {
        setTyping(true);
        // Safety timeout — clear after 5 seconds even if no stop_typing
        if (typingIndicatorTimeoutRef.current) clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = setTimeout(() => setTyping(false), 5000);
      }
    };

    const handleStopTyping = (data: { conversationId: string; senderType: string }) => {
      if (data.senderType === 'agent' && data.conversationId === selectedConvIdRef.current) {
        setTyping(false);
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }
      }
    };

    // ── Message edited/deleted ──
    const handleMessageEdited = (msg: ChatMessage) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    };

    const handleMessageDeleted = ({ id }: { id: string }) => {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('message_read', handleMessageRead);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('connect', joinAllRooms);
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('message_read', handleMessageRead);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket]);

  // Join room for newly loaded conversations
  useEffect(() => {
    if (!socket?.connected) return;
    conversations.forEach(c => socket.emit('join_conversation', c.id));
  }, [socket, conversations]);

  // Fetch missed messages on reconnect
  useEffect(() => {
    if (!connected || !selectedConvIdRef.current) return;
    // Refresh messages for active conversation on reconnect
    const convId = selectedConvIdRef.current;
    chatApi.getMessages(convId).then(msgs => {
      setMessages(prev => {
        // Merge: keep any temp messages, replace/add real ones
        const realIds = new Set(msgs.map(m => m.id));
        const temps = prev.filter(m => m.id.startsWith('temp-') && !realIds.has(m.id));
        return [...msgs, ...temps];
      });
    }).catch(() => {});
  }, [connected]);

  // ── Open conversation ──
  const openConversation = (convId: string) => {
    setSelectedConvId(convId);
    setScreen('thread');
    setTyping(false);
    setShowNewMsgPill(false);
    setMsgStatuses({});
    loadMessages(convId);

    // Clear unread for this conversation
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, unread_count_customer: 0 } : c
    ));
  };

  // ── Scroll tracking ──
  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    isAtBottomRef.current = distanceFromBottom < 80;
    if (isAtBottomRef.current) {
      setShowNewMsgPill(false);
    }
  }, []);

  // Auto-scroll or show pill on new messages
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];

    if (isAtBottomRef.current || last.sender_type === 'customer') {
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setShowNewMsgPill(false);
    } else if (last.sender_type === 'agent') {
      setShowNewMsgPill(true);
    }
  }, [messages.length]);

  // ── Customer typing emission ──
  const emitTyping = useCallback(() => {
    const convId = selectedConvIdRef.current;
    if (!socket?.connected || !convId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { conversationId: convId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (socket?.connected && convId) {
        socket.emit('stop_typing', { conversationId: convId });
      }
    }, 3000);
  }, [socket]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket?.connected && selectedConvIdRef.current) {
      isTypingRef.current = false;
      socket.emit('stop_typing', { conversationId: selectedConvIdRef.current });
    }
  }, [socket]);

  // ── Send message ──
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !selectedConvId) return;

    setInputText('');
    stopTyping();
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      conversation_id: selectedConvId,
      sender_type: 'customer',
      sender_id: null,
      content: text,
      message_type: 'text',
      file_url: null,
      file_name: null,
      is_read: false,
      is_deleted: false,
      edited_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const msg = await chatApi.sendMessage(selectedConvId, { content: text });
      setMessages(prev => prev.map(m => m.id === tempId ? msg : m));
      setMsgStatuses(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[msg.id] = 'sent';
        return next;
      });

      // Update conversation preview
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === selectedConvId);
        if (idx === -1) return prev;
        const conv = { ...prev[idx], last_message_preview: text, last_message_at: msg.created_at };
        const next = [...prev];
        next.splice(idx, 1);
        return [conv, ...next];
      });
    } catch (err: any) {
      setMsgStatuses(prev => ({ ...prev, [tempId]: 'failed' }));
      Alert.alert('Send Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Retry failed message
  const handleRetry = async (tempId: string) => {
    const msg = messages.find(m => m.id === tempId);
    if (!msg || !selectedConvId) return;

    setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const sent = await chatApi.sendMessage(selectedConvId, { content: msg.content });
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
      setMsgStatuses(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[sent.id] = 'sent';
        return next;
      });
    } catch (err: any) {
      setMsgStatuses(prev => ({ ...prev, [tempId]: 'failed' }));
    }
  };

  // Create new conversation
  const handleCreateConversation = async () => {
    const text = inputText.trim();
    if (!text) return;

    setSending(true);
    try {
      const result = await chatApi.createConversation({
        subject: newSubject || undefined,
        category: newCategory,
        message: text,
      });
      setInputText('');
      setNewSubject('');
      setSelectedConvId(result.conversation.id);
      setMessages([result.message]);
      setScreen('thread');
      loadConversations();

      // Join the new conversation room
      if (socket?.connected) {
        socket.emit('join_conversation', result.conversation.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create conversation');
    } finally {
      setSending(false);
    }
  };

  // Image picker
  const handlePickImage = async () => {
    if (!selectedConvId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSending(true);
    try {
      const msg = await chatApi.uploadFile(selectedConvId, {
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload image');
    } finally {
      setSending(false);
    }
  };

  // Input change with typing emission
  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.trim()) {
      emitTyping();
    } else {
      stopTyping();
    }
  };

  // ── Message status icon ──
  const renderMsgStatus = (msgId: string) => {
    const status = msgStatuses[msgId];
    if (!status) return null;

    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />;
      case 'sent':
        return <Ionicons name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.6)" />;
      case 'read':
        return <Ionicons name="checkmark-done-outline" size={12} color="#60A5FA" />;
      case 'failed':
        return <Ionicons name="alert-circle" size={12} color="#EF4444" />;
      default:
        return null;
    }
  };

  // ── Conversations List Screen ──
  if (screen === 'list') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Support</Text>
            <Text style={styles.headerSubtitle}>
              {connected ? 'Online' : 'We typically reply within a few hours'}
            </Text>
          </View>
          <Pressable onPress={loadConversations} style={styles.backBtn}>
            <Ionicons name="refresh" size={22} color={Colors.foregroundMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="chatbubbles" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Support</Text>
            <Text style={styles.welcomeText}>
              Start a new conversation and we'll get back to you as soon as possible.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Pressable style={styles.convItem} onPress={() => openConversation(item.id)}>
                <View style={styles.convItemTop}>
                  <Text style={styles.convItemSubject} numberOfLines={1}>
                    {item.subject || item.category?.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.convItemTime}>{timeAgo(item.last_message_at)}</Text>
                </View>
                <Text style={styles.convItemPreview} numberOfLines={1}>
                  {item.last_message_preview || 'No messages yet'}
                </Text>
                <View style={styles.convItemBottom}>
                  <View style={[styles.statusBadge, statusColor(item.status)]}>
                    <Text style={[styles.statusText, statusTextColor(item.status)]}>{formatStatus(item.status)}</Text>
                  </View>
                  {item.unread_count_customer > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread_count_customer}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}

        {/* New Conversation FAB */}
        <Pressable style={styles.fab} onPress={() => setScreen('new')}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── New Conversation Screen ──
  if (screen === 'new') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setScreen('list')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>New Conversation</Text>
            <Text style={styles.headerSubtitle}>How can we help you?</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.newConvBody}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[styles.categoryChip, newCategory === cat.value && styles.categoryChipActive]}
                  onPress={() => setNewCategory(cat.value)}
                >
                  <Ionicons name={cat.icon} size={18} color={newCategory === cat.value ? '#FFF' : Colors.foregroundSecondary} />
                  <Text style={[styles.categoryChipText, newCategory === cat.value && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Subject (optional)</Text>
            <TextInput
              style={styles.subjectInput}
              placeholder="Brief description of your issue"
              placeholderTextColor={Colors.foregroundMuted}
              value={newSubject}
              onChangeText={setNewSubject}
              maxLength={200}
            />

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.subjectInput, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={Colors.foregroundMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
          </View>

          <View style={styles.newConvFooter}>
            <Pressable
              style={[styles.sendConvBtn, (!inputText.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleCreateConversation}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFF" />
                  <Text style={styles.sendConvBtnText}>Send</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Chat Thread Screen ──
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => { setScreen('list'); loadConversations(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <Text style={styles.headerSubtitle}>
            {typing ? 'Support is typing...' : conversations.find(c => c.id === selectedConvId)?.subject || 'Conversation'}
          </Text>
        </View>
        {!connected && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.amber} />
          </View>
        )}
      </View>

      {/* Reconnection banner */}
      {!connected && (
        <View style={styles.reconnectBanner}>
          <Ionicons name="wifi" size={14} color="#FFF" />
          <Text style={styles.reconnectText}>Reconnecting...</Text>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (isAtBottomRef.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListFooterComponent={
            typing ? (
              <View style={styles.typingIndicator}>
                <View style={styles.supportAvatar}>
                  <Ionicons name="headset" size={12} color="#FFF" />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                  <Text style={styles.typingText}>Support is typing...</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDate = !prevMsg || formatDate(item.created_at) !== formatDate(prevMsg.created_at);

            if (item.sender_type === 'system') {
              return (
                <>
                  {showDate && (
                    <View style={styles.dateSeparator}>
                      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                    </View>
                  )}
                  <View style={styles.systemMsg}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.foregroundMuted} />
                    <Text style={styles.systemMsgText}>{item.content}</Text>
                  </View>
                </>
              );
            }

            const isUser = item.sender_type === 'customer';
            const isFailed = msgStatuses[item.id] === 'failed';

            return (
              <>
                {showDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                )}
                <Pressable
                  style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}
                  onPress={isFailed ? () => handleRetry(item.id) : undefined}
                >
                  {!isUser && (
                    <View style={styles.supportAvatar}>
                      <Ionicons name="headset" size={16} color="#FFF" />
                    </View>
                  )}
                  <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.supportBubble,
                    item.is_deleted && { opacity: 0.5 },
                    isFailed && { opacity: 0.6 },
                  ]}>
                    {item.message_type === 'image' && item.file_url && !item.is_deleted && (
                      <Image source={{ uri: item.file_url }} style={styles.msgImage} resizeMode="cover" />
                    )}
                    {item.message_type === 'file' && item.file_url && !item.is_deleted && (
                      <View style={styles.msgFile}>
                        <Ionicons name="document-outline" size={16} color={isUser ? '#FFF' : Colors.primary} />
                        <Text style={[styles.msgFileName, isUser && { color: '#FFF' }]}>{item.file_name || 'File'}</Text>
                      </View>
                    )}
                    {item.content ? (
                      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                        {item.content}
                      </Text>
                    ) : null}
                    <View style={styles.msgMeta}>
                      <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
                        {formatTime(item.created_at)}
                      </Text>
                      {item.edited_at && (
                        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>(edited)</Text>
                      )}
                      {isUser && renderMsgStatus(item.id)}
                      {isFailed && (
                        <Text style={{ fontSize: 10, color: '#EF4444', marginLeft: 4 }}>Tap to retry</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </>
            );
          }}
        />

        {/* New message pill */}
        {showNewMsgPill && (
          <Pressable
            style={styles.newMsgPill}
            onPress={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
              setShowNewMsgPill(false);
            }}
          >
            <Text style={styles.newMsgPillText}>New message</Text>
            <Ionicons name="arrow-down" size={14} color="#FFF" />
          </Pressable>
        )}

        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={22} color={Colors.foregroundMuted} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.foregroundMuted}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function statusColor(status: string) {
  const map: Record<string, object> = {
    open: { backgroundColor: '#DCFCE7' },
    waiting_on_customer: { backgroundColor: '#FEF3C7' },
    waiting_on_agent: { backgroundColor: '#DBEAFE' },
    resolved: { backgroundColor: '#E0F7FA' },
    closed: { backgroundColor: '#FEE2E2' },
  };
  return map[status] || { backgroundColor: '#F3F4F6' };
}

function statusTextColor(status: string) {
  const map: Record<string, object> = {
    open: { color: '#16A34A' },
    waiting_on_customer: { color: '#D97706' },
    waiting_on_agent: { color: '#3B82F6' },
    resolved: { color: '#0891B2' },
    closed: { color: '#EF4444' },
  };
  return map[status] || { color: '#6B7280' };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfacePrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  headerSubtitle: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginTop: 1,
  },
  chatArea: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.tealLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    fontSize: FontSize.body,
    color: Colors.foregroundSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Reconnection banner
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
  },
  reconnectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFF',
  },
  offlineIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Conversations list
  convItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convItemSubject: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    flex: 1,
    textTransform: 'capitalize',
  },
  convItemTime: {
    fontSize: 11,
    color: Colors.foregroundMuted,
    marginLeft: Spacing.sm,
  },
  convItemPreview: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    marginBottom: Spacing.sm,
  },
  convItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // New conversation
  newConvBody: {
    flex: 1,
    padding: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.button,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.foregroundSecondary,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  subjectInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newConvFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sendConvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: Spacing.md,
  },
  sendConvBtnText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },

  // Chat thread
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  systemMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: Spacing.sm,
  },
  systemMsgText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    maxWidth: '85%',
  },
  messageBubbleRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  supportAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: Radius.card,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: Colors.surfaceSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSize.body,
    color: Colors.foreground,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFF',
  },
  msgMeta: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
    color: Colors.foregroundMuted,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: Radius.tag,
    marginBottom: 6,
  },
  msgFile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 4,
  },
  msgFileName: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Typing indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.card,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.foregroundMuted,
  },
  typingText: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },

  // New message pill
  newMsgPill: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  newMsgPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: FontSize.body,
    color: Colors.foreground,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
