import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../hooks/useSettings';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import { PrimaryButton, TextButton } from '../ui/components/Button';
import { Text } from '../ui/components/Text';
import { fontFamilies, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

type Step = { icon: 'camera' | 'time' | 'navigate'; title: TranslationKey; body: TranslationKey };

const STEPS: Step[] = [
  { icon: 'camera', title: 'onboarding.step1.title', body: 'onboarding.step1.body' },
  { icon: 'time', title: 'onboarding.step2.title', body: 'onboarding.step2.body' },
  { icon: 'navigate', title: 'onboarding.step3.title', body: 'onboarding.step3.body' },
];

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { update } = useSettings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // `?step=3` lets the settings screen and marketing screenshots open a slide
  // directly without swiping.
  const params = useLocalSearchParams<{ step?: string }>();
  const requested = Number(params.step ?? 1);
  const start = Number.isFinite(requested)
    ? Math.min(STEPS.length - 1, Math.max(0, Math.round(requested) - 1))
    : 0;
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    if (start > 0) scrollRef.current?.scrollTo({ x: start * width, animated: false });
  }, [start, width]);
  const last = index === STEPS.length - 1;

  async function finish() {
    try {
      await update({ onboarded: true });
    } catch {
      // A failed write only means the intro shows again next launch.
    }
    router.replace('/');
  }

  function advance() {
    if (last) {
      void finish();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  function onMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Text variant="heading">Cột Xe</Text>
        {last ? (
          <View />
        ) : (
          <TextButton title={t('onboarding.skip')} onPress={() => void finish()} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}
      >
        {STEPS.map((step, position) => (
          <View key={step.icon} style={[styles.slide, { width }]}>
            <View
              style={[styles.art, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.artRing, { borderColor: colors.border }]} />
              <View style={[styles.artCore, { backgroundColor: colors.chip }]}>
                <Ionicons name={step.icon} size={64} color={colors.accent} />
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="caption" style={styles.badgeText}>
                  {position + 1}/{STEPS.length}
                </Text>
              </View>
            </View>
            <Text variant="display" style={styles.title}>
              {t(step.title)}
            </Text>
            <Text muted style={styles.body}>
              {t(step.body)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.dots}>
          {STEPS.map((step, position) => (
            <View
              key={step.icon}
              style={[
                styles.dot,
                {
                  backgroundColor: position === index ? colors.primary : colors.border,
                  width: position === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        <PrimaryButton
          title={last ? t('onboarding.start') : t('onboarding.next')}
          onPress={advance}
          accessibilityLabel={last ? t('onboarding.start') : t('onboarding.next')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xs,
  },
  pager: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: spacing.md },
  art: {
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  artRing: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  artCore: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontFamily: fontFamilies.semibold },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', maxWidth: 320 },
  bottom: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center', alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
});
