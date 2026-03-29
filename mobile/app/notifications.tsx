import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { notificationsApi, type AppNotification } from '../services/api';
import { t } from '../services/i18n';
import { useLanguage } from '../services/language';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) return `${mins}${t('notifications.mAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t('notifications.hAgo')}`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}${t('notifications.dAgo')}`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderItem = ({ item }: { item: AppNotification }) => (
    <Pressable
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={[styles.iconCircle, !item.read && styles.iconCircleUnread]}>
        <Ionicons
          name="notifications"
          size={20}
          color={item.read ? Colors.foregroundMuted : Colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>{t('notifications.readAll')}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
  },
  markAllBtn: {
    padding: Spacing.xs,
  },
  markAllText: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  list: {
    paddingVertical: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardUnread: {
    backgroundColor: '#F0FAFB',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconCircleUnread: {
    backgroundColor: Colors.tealLight,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    color: Colors.foreground,
    marginBottom: 2,
  },
  cardTitleUnread: {
    fontWeight: FontWeight.semibold,
  },
  cardBody: {
    fontSize: FontSize.caption,
    color: Colors.foregroundSecondary,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.foregroundMuted,
    marginTop: Spacing.md,
  },
});
