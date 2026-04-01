import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../constants/theme';
import { reviewsApi } from '../services/api';
import { useAlert } from '../services/alert';

export default function WriteReviewScreen() {
  const { bookingId, carName } = useLocalSearchParams<{ bookingId: string; carName: string }>();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert({ title: 'Rating Required', message: 'Please select a star rating.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await reviewsApi.create({ bookingId: bookingId!, rating, reviewText });
      showAlert({
        title: 'Thank You!',
        message: 'Your review has been submitted successfully.',
        type: 'success',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Failed to submit review. Please try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Car Name */}
        <Text style={styles.carName}>{carName || 'Car'}</Text>

        {/* Star Rating */}
        <Text style={styles.label}>Your Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => setRating(s)} style={styles.starBtn}>
              <Ionicons
                name={s <= rating ? 'star' : 'star-outline'}
                size={36}
                color={Colors.amber}
              />
            </Pressable>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </Text>
        )}

        {/* Review Text */}
        <Text style={styles.label}>Your Review (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Share your experience with this car..."
          placeholderTextColor={Colors.foregroundMuted}
          multiline
          maxLength={1000}
          value={reviewText}
          onChangeText={setReviewText}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{reviewText.length}/1000</Text>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
        >
          <Ionicons name="send" size={18} color="#FFF" />
          <Text style={styles.submitText}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Text>
        </Pressable>
      </ScrollView>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  carName: {
    fontSize: FontSize.pageTitle,
    fontWeight: FontWeight.bold,
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  starBtn: {
    padding: Spacing.xs,
  },
  ratingLabel: {
    fontSize: FontSize.body,
    color: Colors.amber,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    fontSize: FontSize.body,
    color: Colors.foreground,
    minHeight: 120,
  },
  charCount: {
    fontSize: FontSize.caption,
    color: Colors.foregroundMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: Radius.button,
    marginTop: Spacing['2xl'],
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: FontSize.button,
    fontWeight: FontWeight.semibold,
    color: '#FFF',
  },
});
