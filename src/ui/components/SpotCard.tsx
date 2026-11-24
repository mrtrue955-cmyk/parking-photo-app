import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { daysLeft } from '../../domain/expiry';
import type { ParkingRecord } from '../../domain/types';
import { useI18n } from '../../i18n';
import { fontFamilies, radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, SecondaryButton } from './Button';
import { Text } from './Text';

type Props = {
  record: ParkingRecord;
  photoUri: string;
  now: number;
  onOpen: () => void;
  onNavigate: () => void;
  onCollect: () => void;
};

export function SpotCard({ record, photoUri, now, onOpen, onNavigate, onCollect }: Props) {
  const { colors } = useTheme();
  const { t, formatTimeAgo } = useI18n();
  const hasGps = record.lat !== null && record.lng !== null;
  const remaining = record.expiresAt !== null ? daysLeft(record.expiresAt, now) : null;
  const title = record.note || t('spot.noNote');

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t('spot.openA11y', { note: title })}
        onPress={onOpen}
      >
        <View>
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={record.id}
          />
          <View style={styles.topRow}>
            <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
              <Text
                variant="caption"
                style={{ color: colors.onPrimary, fontFamily: fontFamilies.semibold }}
              >
                {t('spot.parked')}
              </Text>
            </View>
            {remaining !== null ? (
              <View style={styles.countdown}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text variant="caption" style={styles.countdownText}>
                  {t('spot.daysLeft', { count: remaining })}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.overlay}>
            <Text numberOfLines={2} style={styles.note}>
              {title}
            </Text>
            <Text variant="caption" style={styles.time}>
              {t('spot.parkedFor', { ago: formatTimeAgo(record.createdAt, now) })}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.body}>
        {hasGps ? null : (
          <View style={styles.noGps}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text variant="caption" muted>
              {t('spot.noGps')}
            </Text>
          </View>
        )}
        <View style={styles.actions}>
          <SecondaryButton title={t('spot.collect')} onPress={onCollect} style={styles.secondary} />
          {hasGps ? (
            <PrimaryButton
              title={t('spot.directions')}
              onPress={onNavigate}
              style={styles.primary}
            />
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 232 },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 14, 0.55)',
  },
  countdownText: { color: '#FFFFFF' },
  overlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.input,
    backgroundColor: 'rgba(20, 16, 14, 0.58)',
    gap: 2,
  },
  note: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
  },
  time: { color: 'rgba(255, 255, 255, 0.78)' },
  body: { padding: 14, gap: spacing.sm },
  noGps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
});
