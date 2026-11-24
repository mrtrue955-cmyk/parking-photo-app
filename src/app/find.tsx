import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { Alert, Linking, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../container';
import { pickCurrent } from '../domain/current';
import { distanceMeters, formatDistance, initialBearing, normalizeAngle } from '../domain/geo';
import { shareMessage } from '../domain/share';
import { directionsUrl } from '../native/directions';
import { useParking } from '../hooks/useParking';
import { useI18n } from '../i18n';
import { PrimaryButton, SecondaryButton, TextButton } from '../ui/components/Button';
import { EmptyState } from '../ui/components/EmptyState';
import { SpotMap } from '../ui/components/SpotMap';
import { Text } from '../ui/components/Text';
import { fontFamilies, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';
import { Image } from 'expo-image';

const DIAL = 276;
const REFRESH_MS = 10_000;
const DIRECTIONS = [
  { label: 'N', top: 12, left: DIAL / 2 - 8 },
  { label: 'E', top: DIAL / 2 - 10, left: DIAL - 24 },
  { label: 'S', top: DIAL - 30, left: DIAL / 2 - 8 },
  { label: 'W', top: DIAL / 2 - 10, left: 12 },
] as const;

async function readPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
    ]);
    if (!position) return null;
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}

export default function FindCar() {
  const { colors } = useTheme();
  const { t, locale, formatTimeAgo } = useI18n();
  const insets = useSafeAreaInsets();
  const { records, loaded, now } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const targetLat = current?.lat ?? null;
  const targetLng = current?.lng ?? null;
  const hasTarget = targetLat !== null && targetLng !== null;

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const [locating, setLocating] = useState(true);
  const rotation = useSharedValue(0);

  // Follow the driver: a fresh fix on open, then a slow poll so walking towards
  // the car shortens the distance without draining the battery.
  useEffect(() => {
    if (targetLat === null || targetLng === null) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function start() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setDenied(true);
        setLocating(false);
        return;
      }
      async function tick() {
        const fix = await readPosition();
        if (cancelled) return;
        if (fix) setPosition(fix);
        setLocating(false);
      }
      await tick();
      timer = setInterval(tick, REFRESH_MS);
    }

    start().catch(() => {
      if (!cancelled) setLocating(false);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [targetLat, targetLng]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((next) => {
      const value = next.trueHeading >= 0 ? next.trueHeading : next.magHeading;
      if (value >= 0) setHeading(value);
    })
      .then((next) => {
        if (cancelled) next.remove();
        else subscription = next;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const bearing =
    position && hasTarget ? initialBearing(position, { lat: targetLat!, lng: targetLng! }) : 0;
  const distance =
    position && hasTarget ? distanceMeters(position, { lat: targetLat!, lng: targetLng! }) : null;
  const rotationDeg = heading === null ? bearing : normalizeAngle(bearing - heading);

  useEffect(() => {
    rotation.value = withTiming(rotationDeg, { duration: 240 });
  }, [rotationDeg, rotation]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { translateY: -82 }],
  }));

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  if (!current || !hasTarget) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState icon="navigate-outline" text={t('find.empty')} />
      </View>
    );
  }

  function openDirections() {
    Linking.openURL(directionsUrl(targetLat!, targetLng!)).catch(() =>
      Alert.alert(t('detail.mapErrorTitle'), t('detail.mapErrorBody')),
    );
  }

  function share() {
    Share.share({ message: shareMessage(current!, locale) }).catch(() =>
      Alert.alert(t('common.errorTitle'), t('common.errorBody')),
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <View
        style={styles.dial}
        accessible
        accessibilityLabel={t('find.headingA11y')}
        accessibilityValue={{
          text: distance === null ? undefined : formatDistance(distance, locale),
        }}
      >
        <View
          style={[
            styles.ringOuter,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
        <View style={[styles.ringInner, { borderColor: colors.border }]} />
        {DIRECTIONS.map((item) => (
          <Text
            key={item.label}
            variant="caption"
            muted
            style={[styles.direction, { top: item.top, left: item.left }]}
          >
            {item.label}
          </Text>
        ))}
        <Animated.View style={[styles.arrow, arrowStyle]}>
          <Ionicons name="navigate" size={86} color={colors.primary} />
        </Animated.View>
        <View
          style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Text style={styles.distance}>
            {distance === null ? '—' : formatDistance(distance, locale)}
          </Text>
          <Text variant="caption" muted>
            {denied ? t('find.noPermission') : t('find.away')}
          </Text>
        </View>
      </View>

      {locating && !denied ? (
        <Text variant="caption" muted style={styles.center}>
          {t('find.loading')}
        </Text>
      ) : null}
      {denied ? (
        <View style={styles.denied}>
          <Text variant="caption" muted style={styles.center}>
            {t('find.noPermission')}
          </Text>
          <TextButton title={t('find.openSettings')} onPress={() => Linking.openSettings()} />
        </View>
      ) : null}
      {!denied && heading === null ? (
        <Text variant="caption" muted style={styles.center}>
          {t('find.noCompass')}
        </Text>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.spotRow}>
          <Image
            source={{ uri: files.uriFor(current.photoPath) }}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.spotText}>
            <Text variant="heading" numberOfLines={2}>
              {current.note || t('spot.noNote')}
            </Text>
            <Text variant="caption" muted>
              {t('spot.parkedFor', { ago: formatTimeAgo(current.createdAt, now) })}
            </Text>
          </View>
        </View>
        <SpotMap
          latitude={targetLat!}
          longitude={targetLng!}
          title={current.note || t('detail.mapA11y')}
        />
      </View>

      <View style={styles.actions}>
        <SecondaryButton title={t('find.share')} onPress={share} style={styles.action} />
        <PrimaryButton
          title={t('find.directions')}
          onPress={openDirections}
          style={styles.actionPrimary}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.screen },
  content: { padding: spacing.screen, gap: spacing.md, alignItems: 'center' },
  dial: { width: DIAL, height: DIAL, alignItems: 'center', justifyContent: 'center' },
  ringOuter: {
    position: 'absolute',
    width: DIAL,
    height: DIAL,
    borderRadius: DIAL / 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ringInner: {
    position: 'absolute',
    width: DIAL - 52,
    height: DIAL - 52,
    borderRadius: (DIAL - 52) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  direction: { position: 'absolute', fontFamily: fontFamilies.semibold },
  arrow: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  distance: { fontFamily: fontFamilies.bold, fontSize: 30, lineHeight: 38 },
  denied: { alignItems: 'center', gap: spacing.xs },
  card: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  spotRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.chip },
  spotText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  action: { flex: 1 },
  actionPrimary: { flex: 1.4 },
  center: { textAlign: 'center' },
});
