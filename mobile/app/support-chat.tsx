import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { ChatConversation, ChatMessage, ChatRating, chatApi, SOCKET_URL } from '../services/api';
import { useSocket } from '../services/socket';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
type MsgStatus = 'sending' | 'sent' | 'read' | 'failed';

async function compressImage(uri: string): Promise<{ uri: string; name: string; type: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' };
}

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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const flatListRef = useRef<FlatList>(null);

  // Image viewer
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Attachment picker
  const [showAttachSheet, setShowAttachSheet] = useState(false);

  // Close chat
  const [showCloseSheet, setShowCloseSheet] = useState(false);

  // Rating
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittedRating, setSubmittedRating] = useState<ChatRating | null>(null);
  const [ratingSkipped, setRatingSkipped] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Refs to avoid stale closures
  const selectedConvIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<ChatConversation[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isAtBottomRef = useRef(true);
  const screenRef = useRef<Screen>('list');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Get current selected conversation
  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const isClosed = selectedConv?.status === 'closed';

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

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await chatApi.getMessages(convId);
      setMessages(msgs);
    } catch (err: any) {
      Alert.alert('Load Error', err.message || 'Failed to load messages');
    }
  }, []);

  // ── Socket.IO ──
  useEffect(() => {
    if (!socket) return;

    const joinAllRooms = () => {
      conversationsRef.current.forEach(c => socket.emit('join_conversation', c.id));
    };

    if (socket.connected) joinAllRooms();
    socket.on('connect', joinAllRooms);

    const handleNewMessage = (msg: ChatMessage) => {
      const convId = msg.conversation_id;
      const currentConvId = selectedConvIdRef.current;
      const currentScreen = screenRef.current;

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === convId);
        if (idx === -1) return prev;
        const conv = { ...prev[idx] };
        conv.last_message_preview = msg.content || msg.file_name || 'Attachment';
        conv.last_message_at = msg.created_at;
        if (!(currentScreen === 'thread' && convId === currentConvId) && msg.sender_type === 'agent') {
          conv.unread_count_customer = (conv.unread_count_customer || 0) + 1;
        }
        const next = [...prev];
        next.splice(idx, 1);
        return [conv, ...next];
      });

      if (currentScreen === 'thread' && convId === currentConvId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTyping(false);
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }
        chatApi.getMessages(convId, { limit: 1 }).catch(() => {});
      }
    };

    const handleConversationUpdated = (updated: Partial<ChatConversation> & { id: string }) => {
      setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    };

    const handleTyping = (data: { conversationId: string; senderType: string }) => {
      if (data.senderType === 'agent' && data.conversationId === selectedConvIdRef.current) {
        setTyping(true);
        if (typingIndicatorTimeoutRef.current) clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = setTimeout(() => setTyping(false), 5000);
      }
    };
    const handleStopTyping = (data: { conversationId: string; senderType: string }) => {
      if (data.senderType === 'agent' && data.conversationId === selectedConvIdRef.current) {
        setTyping(false);
        if (typingIndicatorTimeoutRef.current) clearTimeout(typingIndicatorTimeoutRef.current);
      }
    };
    const handleMessageEdited = (msg: ChatMessage) => {
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    };
    const handleMessageDeleted = ({ id }: { id: string }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('connect', joinAllRooms);
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket?.connected) return;
    conversations.forEach(c => socket.emit('join_conversation', c.id));
  }, [socket, conversations]);

  useEffect(() => {
    if (!connected || !selectedConvIdRef.current) return;
    const convId = selectedConvIdRef.current;
    chatApi.getMessages(convId).then(msgs => {
      setMessages(prev => {
        const realIds = new Set(msgs.map(m => m.id));
        const temps = prev.filter(m => m.id.startsWith('temp-') && !realIds.has(m.id));
        return [...msgs, ...temps];
      });
    }).catch(() => {});
  }, [connected]);

  // ── Open conversation ──
  const openConversation = async (convId: string) => {
    setSelectedConvId(convId);
    setScreen('thread');
    setTyping(false);
    setShowNewMsgPill(false);
    setMsgStatuses({});
    setRating(0);
    setFeedbackText('');
    setSubmittedRating(null);
    setRatingSkipped(false);
    loadMessages(convId);

    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count_customer: 0 } : c));

    // Check if already rated
    const existingRating = await chatApi.getRating(convId);
    if (existingRating) setSubmittedRating(existingRating);
  };

  // ── Scroll ──
  const handleScroll = useCallback((e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    isAtBottomRef.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80;
    if (isAtBottomRef.current) setShowNewMsgPill(false);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (isAtBottomRef.current || last.sender_type === 'customer') {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setShowNewMsgPill(false);
    } else if (last.sender_type === 'agent') {
      setShowNewMsgPill(true);
    }
  }, [messages.length]);

  // ── Typing ──
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
      if (socket?.connected && convId) socket.emit('stop_typing', { conversationId: convId });
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
    if (!text || sending || !selectedConvId || isClosed) return;
    setInputText('');
    stopTyping();
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId, conversation_id: selectedConvId, sender_type: 'customer', sender_id: null,
      content: text, message_type: 'text', file_url: null, file_name: null,
      is_read: false, is_deleted: false, edited_at: null, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const msg = await chatApi.sendMessage(selectedConvId, { content: text });
      setMessages(prev => prev.map(m => m.id === tempId ? msg : m));
      setMsgStatuses(prev => { const n = { ...prev }; delete n[tempId]; n[msg.id] = 'sent'; return n; });
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === selectedConvId);
        if (idx === -1) return prev;
        const conv = { ...prev[idx], last_message_preview: text, last_message_at: msg.created_at };
        const next = [...prev]; next.splice(idx, 1); return [conv, ...next];
      });
    } catch (err: any) {
      setMsgStatuses(prev => ({ ...prev, [tempId]: 'failed' }));
      Alert.alert('Send Error', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (tempId: string) => {
    const msg = messages.find(m => m.id === tempId);
    if (!msg || !selectedConvId) return;
    setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));
    try {
      const sent = await chatApi.sendMessage(selectedConvId, { content: msg.content });
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
      setMsgStatuses(prev => { const n = { ...prev }; delete n[tempId]; n[sent.id] = 'sent'; return n; });
    } catch { setMsgStatuses(prev => ({ ...prev, [tempId]: 'failed' })); }
  };

  // ── Image attachment ──
  const handleImagePick = async (source: 'camera' | 'gallery') => {
    setShowAttachSheet(false);
    if (!selectedConvId || isClosed) return;

    // Request permission
    const permFn = source === 'camera'
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        `${source === 'camera' ? 'Camera' : 'Gallery'} access is needed to send photos. You can enable it in Settings.`,
        [{ text: 'Cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }

    const launchFn = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await launchFn({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];

    // Validate type
    const mime = asset.mimeType || '';
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(mime) && !asset.uri.match(/\.(jpe?g|png)$/i)) {
      Alert.alert('Invalid File', 'Only JPG and PNG images are allowed.');
      return;
    }

    // Compress
    let file: { uri: string; name: string; type: string };
    try {
      file = await compressImage(asset.uri);
    } catch {
      Alert.alert('Error', 'Failed to compress image. Please try again.');
      return;
    }

    // Optimistic UI
    const tempId = `temp-img-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId, conversation_id: selectedConvId, sender_type: 'customer', sender_id: null,
      content: '', message_type: 'image', file_url: file.uri, file_name: file.name,
      is_read: false, is_deleted: false, edited_at: null, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));
    setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

    try {
      const msg = await chatApi.uploadFileWithProgress(selectedConvId, file, (pct) => {
        setUploadProgress(prev => ({ ...prev, [tempId]: pct }));
      });
      setMessages(prev => prev.map(m => m.id === tempId ? msg : m));
      setMsgStatuses(prev => { const n = { ...prev }; delete n[tempId]; n[msg.id] = 'sent'; return n; });
      setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === selectedConvId);
        if (idx === -1) return prev;
        const conv = { ...prev[idx], last_message_preview: '📷 Photo', last_message_at: msg.created_at };
        const next = [...prev]; next.splice(idx, 1); return [conv, ...next];
      });
    } catch (err: any) {
      setMsgStatuses(prev => ({ ...prev, [tempId]: 'failed' }));
      setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      Alert.alert('Upload Error', err.message || 'Failed to upload image');
    }
  };

  // ── Save image to gallery ──
  const handleSaveImage = async (url: string) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to save photos.');
      return;
    }
    try {
      await MediaLibrary.saveToLibraryAsync(url);
      Alert.alert('Saved', 'Image saved to your gallery.');
    } catch {
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  // ── Close conversation ──
  const handleCloseConversation = async () => {
    if (!selectedConvId) return;
    setShowCloseSheet(false);
    try {
      const updated = await chatApi.closeConversation(selectedConvId);
      setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, ...updated } : c));
      // Reload messages to get the system message
      await loadMessages(selectedConvId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to close conversation');
    }
  };

  // ── Create conversation ──
  const handleCreateConversation = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    try {
      const result = await chatApi.createConversation({ subject: newSubject || undefined, category: newCategory, message: text });
      setInputText('');
      setNewSubject('');
      setSelectedConvId(result.conversation.id);
      setMessages([result.message]);
      setScreen('thread');
      setSubmittedRating(null);
      setRatingSkipped(false);
      loadConversations();
      if (socket?.connected) socket.emit('join_conversation', result.conversation.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create conversation');
    } finally {
      setSending(false);
    }
  };

  // ── Rating ──
  const handleSubmitRating = async () => {
    if (!selectedConvId || rating === 0) return;
    setSubmittingRating(true);
    try {
      const saved = await chatApi.submitRating(selectedConvId, { rating, feedbackText: feedbackText.trim() || undefined });
      setSubmittedRating(saved);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.trim()) emitTyping(); else stopTyping();
  };

  // ── Message status icon ──
  const renderMsgStatus = (msgId: string) => {
    const s = msgStatuses[msgId];
    if (!s) return null;
    if (s === 'sending') return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />;
    if (s === 'sent') return <Ionicons name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.6)" />;
    if (s === 'read') return <Ionicons name="checkmark-done-outline" size={12} color="#60A5FA" />;
    if (s === 'failed') return <Ionicons name="alert-circle" size={12} color="#EF4444" />;
    return null;
  };

  // ── Rating placeholder text ──
  const ratingPlaceholder = rating <= 2 ? "We're sorry to hear that. What went wrong?"
    : rating === 3 ? 'How could we improve?'
    : 'Anything you\'d like to share?';

  // ══════════════════════════════════════════
  // CONVERSATIONS LIST
  // ══════════════════════════════════════════
  if (screen === 'list') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Support</Text>
            <Text style={styles.headerSubtitle}>{connected ? 'Online' : 'We typically reply within a few hours'}</Text>
          </View>
          <Pressable onPress={loadConversations} style={styles.backBtn}>
            <Ionicons name="refresh" size={22} color={Colors.foregroundMuted} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : conversations.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.welcomeIcon}><Ionicons name="chatbubbles" size={40} color={Colors.primary} /></View>
            <Text style={styles.welcomeTitle}>Welcome to Support</Text>
            <Text style={styles.welcomeText}>Start a new conversation and we'll get back to you as soon as possible.</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Pressable style={styles.convItem} onPress={() => openConversation(item.id)}>
                <View style={styles.convItemTop}>
                  <Text style={styles.convItemSubject} numberOfLines={1}>
                    {item.subject || item.category?.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.convItemTime}>{timeAgo(item.last_message_at)}</Text>
                </View>
                <Text style={styles.convItemPreview} numberOfLines={1}>{item.last_message_preview || 'No messages yet'}</Text>
                <View style={styles.convItemBottom}>
                  <View style={[styles.statusBadge, statusColor(item.status)]}>
                    <Text style={[styles.statusText, statusTextColor(item.status)]}>{formatStatus(item.status)}</Text>
                  </View>
                  {item.unread_count_customer > 0 && (
                    <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread_count_customer}</Text></View>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
        <Pressable style={styles.fab} onPress={() => setScreen('new')}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════
  // NEW CONVERSATION
  // ══════════════════════════════════════════
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
              {CATEGORIES.map(cat => (
                <Pressable key={cat.value} style={[styles.categoryChip, newCategory === cat.value && styles.categoryChipActive]} onPress={() => setNewCategory(cat.value)}>
                  <Ionicons name={cat.icon} size={18} color={newCategory === cat.value ? '#FFF' : Colors.foregroundSecondary} />
                  <Text style={[styles.categoryChipText, newCategory === cat.value && styles.categoryChipTextActive]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Subject (optional)</Text>
            <TextInput style={styles.subjectInput} placeholder="Brief description" placeholderTextColor={Colors.foregroundMuted} value={newSubject} onChangeText={setNewSubject} maxLength={200} />
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput style={[styles.subjectInput, { minHeight: 100, textAlignVertical: 'top' }]} placeholder="Describe your issue..." placeholderTextColor={Colors.foregroundMuted} value={inputText} onChangeText={setInputText} multiline maxLength={2000} />
          </View>
          <View style={styles.newConvFooter}>
            <Pressable style={[styles.sendConvBtn, (!inputText.trim() || sending) && { opacity: 0.4 }]} onPress={handleCreateConversation} disabled={!inputText.trim() || sending}>
              {sending ? <ActivityIndicator size="small" color="#FFF" /> : <><Ionicons name="send" size={18} color="#FFF" /><Text style={styles.sendConvBtnText}>Send</Text></>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════
  // CHAT THREAD
  // ══════════════════════════════════════════

  const renderRatingCard = () => {
    // Already rated — show read-only
    if (submittedRating) {
      const thankMsg = submittedRating.rating >= 4
        ? "Thank you for your feedback! We're glad we could help."
        : "Thank you for your feedback. We'll work on doing better.";
      return (
        <View style={styles.ratingCard}>
          <Text style={styles.ratingThankYou}>{thankMsg}</Text>
          <View style={styles.ratingStarsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name={i <= submittedRating.rating ? 'star' : 'star-outline'} size={24} color={i <= submittedRating.rating ? '#F59E0B' : Colors.border} />
            ))}
          </View>
        </View>
      );
    }

    // Skipped
    if (ratingSkipped) return null;

    // Not closed — no rating card
    if (!isClosed) return null;

    return (
      <View style={styles.ratingCard}>
        <Text style={styles.ratingTitle}>How was your experience?</Text>
        <View style={styles.ratingStarsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <Pressable key={i} onPress={() => setRating(i)} hitSlop={8}>
              <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={36} color={i <= rating ? '#F59E0B' : Colors.border} />
            </Pressable>
          ))}
        </View>
        {rating > 0 && (
          <>
            <TextInput
              style={styles.feedbackInput}
              placeholder={ratingPlaceholder}
              placeholderTextColor={Colors.foregroundMuted}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              maxLength={1000}
              autoFocus={rating <= 2}
            />
            <Pressable style={[styles.submitRatingBtn, submittingRating && { opacity: 0.5 }]} onPress={handleSubmitRating} disabled={submittingRating}>
              {submittingRating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitRatingText}>Submit</Text>}
            </Pressable>
          </>
        )}
        <Pressable onPress={() => setRatingSkipped(true)} style={{ marginTop: 8 }}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { setScreen('list'); loadConversations(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <Text style={styles.headerSubtitle}>
            {typing ? 'Support is typing...' : selectedConv?.subject || 'Conversation'}
          </Text>
        </View>
        {!isClosed && (
          <Pressable onPress={() => setShowCloseSheet(true)} style={styles.backBtn}>
            <Text style={{ fontSize: 12, color: Colors.foregroundMuted, fontWeight: '600' }}>End</Text>
          </Pressable>
        )}
        {!connected && <View style={styles.offlineIndicator}><Ionicons name="cloud-offline-outline" size={16} color={Colors.amber} /></View>}
      </View>

      {!connected && (
        <View style={styles.reconnectBanner}>
          <Ionicons name="wifi" size={14} color="#FFF" />
          <Text style={styles.reconnectText}>Reconnecting...</Text>
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      )}

      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          onContentSizeChange={() => { if (isAtBottomRef.current) flatListRef.current?.scrollToEnd({ animated: false }); }}
          ListFooterComponent={
            <>
              {typing && (
                <View style={styles.typingIndicator}>
                  <View style={styles.supportAvatarSmall}><Ionicons name="headset" size={12} color="#FFF" /></View>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingDots}>
                      <View style={styles.typingDot} /><View style={styles.typingDot} /><View style={styles.typingDot} />
                    </View>
                    <Text style={styles.typingText}>Support is typing...</Text>
                  </View>
                </View>
              )}
              {renderRatingCard()}
            </>
          }
          renderItem={({ item, index }) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showDateHeader = !prevMsg || formatDate(item.created_at) !== formatDate(prevMsg.created_at);

            if (item.sender_type === 'system') {
              return (
                <>
                  {showDateHeader && <View style={styles.dateSeparator}><Text style={styles.dateText}>{formatDate(item.created_at)}</Text></View>}
                  <View style={styles.systemMsg}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.foregroundMuted} />
                    <Text style={styles.systemMsgText}>{item.content}</Text>
                  </View>
                </>
              );
            }

            const isUser = item.sender_type === 'customer';
            const isFailed = msgStatuses[item.id] === 'failed';
            const isUploading = uploadProgress[item.id] !== undefined;
            const isImage = item.message_type === 'image' && item.file_url && !item.is_deleted;
            const imgUrl = isImage ? (item.file_url!.startsWith('http') ? item.file_url! : `${SOCKET_URL}${item.file_url}`) : null;

            return (
              <>
                {showDateHeader && <View style={styles.dateSeparator}><Text style={styles.dateText}>{formatDate(item.created_at)}</Text></View>}
                <Pressable
                  style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}
                  onPress={isFailed ? () => handleRetry(item.id) : undefined}
                >
                  {!isUser && <View style={styles.supportAvatar}><Ionicons name="headset" size={16} color="#FFF" /></View>}
                  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.supportBubble, item.is_deleted && { opacity: 0.5 }, isFailed && { opacity: 0.6 }]}>
                    {isImage && imgUrl && (
                      <Pressable onPress={() => setViewerImage(imgUrl)}>
                        <View>
                          <Image source={{ uri: imgUrl }} style={styles.msgImage} resizeMode="cover" />
                          {isUploading && (
                            <View style={styles.uploadOverlay}>
                              <ActivityIndicator size="small" color="#FFF" />
                              <Text style={styles.uploadProgressText}>{uploadProgress[item.id]}%</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    )}
                    {item.message_type === 'file' && item.file_url && !item.is_deleted && (
                      <View style={styles.msgFile}>
                        <Ionicons name="document-outline" size={16} color={isUser ? '#FFF' : Colors.primary} />
                        <Text style={[styles.msgFileName, isUser && { color: '#FFF' }]}>{item.file_name || 'File'}</Text>
                      </View>
                    )}
                    {item.content ? <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.content}</Text> : null}
                    <View style={styles.msgMeta}>
                      <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>{formatTime(item.created_at)}</Text>
                      {item.edited_at && <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>(edited)</Text>}
                      {isUser && renderMsgStatus(item.id)}
                      {isFailed && <Text style={{ fontSize: 10, color: '#EF4444', marginLeft: 4 }}>Tap to retry</Text>}
                    </View>
                  </View>
                </Pressable>
              </>
            );
          }}
        />

        {showNewMsgPill && (
          <Pressable style={styles.newMsgPill} onPress={() => { flatListRef.current?.scrollToEnd({ animated: true }); setShowNewMsgPill(false); }}>
            <Text style={styles.newMsgPillText}>New message</Text>
            <Ionicons name="arrow-down" size={14} color="#FFF" />
          </Pressable>
        )}

        {/* Input bar or closed banner */}
        {isClosed ? (
          <View style={styles.closedBanner}>
            <Text style={styles.closedBannerText}>This conversation has ended. Need more help?</Text>
            <Pressable style={styles.newConvSmallBtn} onPress={() => setScreen('new')}>
              <Text style={styles.newConvSmallBtnText}>Start New Conversation</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <Pressable style={styles.attachBtn} onPress={() => setShowAttachSheet(true)}>
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
            <Pressable style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!inputText.trim() || sending}>
              <Ionicons name="send" size={20} color="#FFF" />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Attachment Bottom Sheet ── */}
      <Modal visible={showAttachSheet} transparent animationType="slide" onRequestClose={() => setShowAttachSheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowAttachSheet(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Pressable style={styles.sheetOption} onPress={() => handleImagePick('camera')}>
              <Ionicons name="camera-outline" size={24} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.sheetOption} onPress={() => handleImagePick('gallery')}>
              <Ionicons name="images-outline" size={24} color={Colors.primary} />
              <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={() => setShowAttachSheet(false)}>
              <Ionicons name="close-outline" size={24} color={Colors.foregroundMuted} />
              <Text style={[styles.sheetOptionText, { color: Colors.foregroundMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Close Confirmation Bottom Sheet ── */}
      <Modal visible={showCloseSheet} transparent animationType="slide" onRequestClose={() => setShowCloseSheet(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowCloseSheet(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>End this conversation?</Text>
            <Text style={styles.sheetSubtitle}>You can start a new one anytime if you need more help.</Text>
            <Pressable style={styles.closeConfirmBtn} onPress={handleCloseConversation}>
              <Text style={styles.closeConfirmBtnText}>End Chat</Text>
            </Pressable>
            <Pressable style={styles.closeCancelBtn} onPress={() => setShowCloseSheet(false)}>
              <Text style={styles.closeCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── Full-Screen Image Viewer ── */}
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <View style={styles.imageViewerBg}>
          <Pressable style={styles.imageViewerClose} onPress={() => setViewerImage(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>
          {viewerImage && <Image source={{ uri: viewerImage }} style={styles.imageViewerImg} resizeMode="contain" />}
          {viewerImage && (
            <Pressable style={styles.imageViewerSave} onPress={() => handleSaveImage(viewerImage)}>
              <Ionicons name="download-outline" size={22} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Save to Gallery</Text>
            </Pressable>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatStatus(s: string): string { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function statusColor(s: string) {
  const m: Record<string, object> = { open: { backgroundColor: '#DCFCE7' }, waiting_on_customer: { backgroundColor: '#FEF3C7' }, waiting_on_agent: { backgroundColor: '#DBEAFE' }, resolved: { backgroundColor: '#E0F7FA' }, closed: { backgroundColor: '#FEE2E2' } };
  return m[s] || { backgroundColor: '#F3F4F6' };
}
function statusTextColor(s: string) {
  const m: Record<string, object> = { open: { color: '#16A34A' }, waiting_on_customer: { color: '#D97706' }, waiting_on_agent: { color: '#3B82F6' }, resolved: { color: '#0891B2' }, closed: { color: '#EF4444' } };
  return m[s] || { color: '#6B7280' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfacePrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.semibold, color: Colors.foreground },
  headerSubtitle: { fontSize: FontSize.caption, color: Colors.foregroundMuted, marginTop: 1 },
  chatArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['3xl'] },
  welcomeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.tealLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  welcomeTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.foreground, marginBottom: Spacing.sm },
  welcomeText: { fontSize: FontSize.body, color: Colors.foregroundSecondary, textAlign: 'center', lineHeight: 20 },

  reconnectBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6, backgroundColor: '#F59E0B' },
  reconnectText: { fontSize: 12, fontWeight: '500', color: '#FFF' },
  offlineIndicator: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },

  convItem: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  convItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convItemSubject: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.foreground, flex: 1, textTransform: 'capitalize' },
  convItemTime: { fontSize: 11, color: Colors.foregroundMuted, marginLeft: Spacing.sm },
  convItemPreview: { fontSize: FontSize.caption, color: Colors.foregroundMuted, marginBottom: Spacing.sm },
  convItemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: 11, fontWeight: FontWeight.semibold },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#FFF' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },

  newConvBody: { flex: 1, padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.foregroundSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.button, backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.foregroundSecondary },
  categoryChipTextActive: { color: '#FFF' },
  subjectInput: { backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.button, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.body, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border },
  newConvFooter: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  sendConvBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: Spacing.md },
  sendConvBtnText: { fontSize: FontSize.button, fontWeight: FontWeight.semibold, color: '#FFF' },

  messagesList: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  dateSeparator: { alignItems: 'center', marginVertical: Spacing.md },
  dateText: { fontSize: FontSize.caption, color: Colors.foregroundMuted, backgroundColor: Colors.surfaceSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, overflow: 'hidden' },
  systemMsg: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: Spacing.sm },
  systemMsgText: { fontSize: FontSize.caption, color: Colors.foregroundMuted },
  messageBubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.sm, gap: Spacing.sm, maxWidth: '85%' },
  messageBubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  supportAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  supportAvatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { padding: Spacing.md, borderRadius: Radius.card, maxWidth: '100%' },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  supportBubble: { backgroundColor: Colors.surfaceSecondary, borderBottomLeftRadius: 4 },
  messageText: { fontSize: FontSize.body, color: Colors.foreground, lineHeight: 20 },
  userMessageText: { color: '#FFF' },
  msgMeta: { flexDirection: 'row', gap: 4, marginTop: 4, alignSelf: 'flex-end', alignItems: 'center' },
  messageTime: { fontSize: 11, color: Colors.foregroundMuted },
  userMessageTime: { color: 'rgba(255,255,255,0.7)' },
  msgImage: { width: SCREEN_WIDTH * 0.55, height: 200, borderRadius: Radius.tag, marginBottom: 6 },
  msgFile: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, marginBottom: 4 },
  msgFileName: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.primary },

  // Upload overlay
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.tag, justifyContent: 'center', alignItems: 'center' },
  uploadProgressText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 },

  typingIndicator: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceSecondary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.card, borderBottomLeftRadius: 4 },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.foregroundMuted },
  typingText: { fontSize: FontSize.caption, color: Colors.foregroundMuted },

  newMsgPill: { position: 'absolute', bottom: 70, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  newMsgPillText: { fontSize: 12, fontWeight: '600', color: '#FFF' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.sm },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, backgroundColor: Colors.surfaceSecondary, borderRadius: 20, paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: FontSize.body, color: Colors.foreground, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },

  // Closed banner
  closedBanner: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', gap: Spacing.sm },
  closedBannerText: { fontSize: FontSize.caption, color: Colors.foregroundMuted, textAlign: 'center' },
  newConvSmallBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.button },
  newConvSmallBtnText: { fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: '#FFF' },

  // Bottom sheets
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: Colors.surfacePrimary, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetOptionText: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.foreground },
  sheetTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.foreground, textAlign: 'center', marginBottom: Spacing.sm },
  sheetSubtitle: { fontSize: FontSize.body, color: Colors.foregroundMuted, textAlign: 'center', marginBottom: Spacing.xl },
  closeConfirmBtn: { backgroundColor: '#EF4444', borderRadius: Radius.button, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.sm },
  closeConfirmBtnText: { color: '#FFF', fontSize: FontSize.button, fontWeight: FontWeight.semibold },
  closeCancelBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.button, paddingVertical: Spacing.md, alignItems: 'center' },
  closeCancelBtnText: { color: Colors.foreground, fontSize: FontSize.button, fontWeight: FontWeight.semibold },

  // Rating card
  ratingCard: { margin: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.card, alignItems: 'center' },
  ratingTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.semibold, color: Colors.foreground, marginBottom: Spacing.md },
  ratingStarsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  ratingThankYou: { fontSize: FontSize.body, color: Colors.foregroundSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  feedbackInput: { width: '100%', backgroundColor: Colors.surfacePrimary, borderRadius: Radius.button, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.body, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border, minHeight: 60, textAlignVertical: 'top', marginTop: Spacing.sm },
  submitRatingBtn: { marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: Spacing.md, paddingHorizontal: Spacing['3xl'], alignItems: 'center' },
  submitRatingText: { color: '#FFF', fontSize: FontSize.button, fontWeight: FontWeight.semibold },
  skipText: { fontSize: FontSize.caption, color: Colors.foregroundMuted },

  // Image viewer
  imageViewerBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  imageViewerImg: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  imageViewerSave: { position: 'absolute', bottom: 50, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full },
});
