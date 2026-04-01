import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { SupportMessage, supportApi } from '../services/api';

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SupportChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    try {
      await supportApi.getConversation();
      const msgs = await supportApi.getMessages(1, 100);
      setMessages(msgs);
    } catch {
      // conversation will be created on first message
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic add
    const tempMsg: SupportMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: '',
      sender_type: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const msg = await supportApi.sendMessage(text);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? msg : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: SupportMessage; index: number }) => {
    const isUser = item.sender_type === 'user';
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || formatMessageDate(item.created_at) !== formatMessageDate(prevMsg.created_at);

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatMessageDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}>
          {!isUser && (
            <View style={styles.supportAvatar}>
              <Ionicons name="headset" size={16} color="#FFF" />
            </View>
          )}
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.supportBubble]}>
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {item.message}
            </Text>
            <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Support Chat</Text>
          <Text style={styles.headerSubtitle}>We typically reply within a few hours</Text>
        </View>
        <Pressable onPress={loadMessages} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color={Colors.foregroundMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="chatbubbles" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Support</Text>
            <Text style={styles.welcomeText}>
              Send us a message and we'll get back to you as soon as possible.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
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
  headerInfo: {
    flex: 1,
  },
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
  chatArea: {
    flex: 1,
  },
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
  messageTime: {
    fontSize: 11,
    color: Colors.foregroundMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
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
