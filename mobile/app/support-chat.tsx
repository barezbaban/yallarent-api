import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

export default function SupportChatScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('list');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newCategory, setNewCategory] = useState('general_inquiry');
  const [newSubject, setNewSubject] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
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
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const openConversation = (convId: string) => {
    setSelectedConvId(convId);
    setScreen('thread');
    loadMessages(convId);
  };

  // Send message
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !selectedConvId) return;

    setInputText('');
    setSending(true);

    // Optimistic add
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
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
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const msg = await chatApi.sendMessage(selectedConvId, { content: text });
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? msg : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInputText(text);
    } finally {
      setSending(false);
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
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
    } finally {
      setSending(false);
    }
  };

  // Image picker
  const handlePickImage = async () => {
    if (!selectedConvId) return;
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
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setSending(false);
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
            <Text style={styles.headerSubtitle}>We typically reply within a few hours</Text>
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
            {conversations.find(c => c.id === selectedConvId)?.subject || 'Conversation'}
          </Text>
        </View>
        <Pressable onPress={() => selectedConvId && loadMessages(selectedConvId)} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color={Colors.foregroundMuted} />
        </Pressable>
      </View>

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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
            return (
              <>
                {showDate && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                )}
                <View style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}>
                  {!isUser && (
                    <View style={styles.supportAvatar}>
                      <Ionicons name="headset" size={16} color="#FFF" />
                    </View>
                  )}
                  <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.supportBubble, item.is_deleted && { opacity: 0.5 }]}>
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
                    </View>
                  </View>
                </View>
              </>
            );
          }}
        />

        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={22} color={Colors.foregroundMuted} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.foregroundMuted}
            value={inputText}
            onChangeText={setInputText}
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
