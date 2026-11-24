import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from './theme';
import { useTheme } from './useTheme';
import { Text } from './components/Text';

type ToastPayload = { message: string; actionLabel?: string; onAction?: () => void };

type ToastApi = { show: (payload: ToastPayload, durationMs?: number) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((payload: ToastPayload, durationMs = 4500) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(payload);
    timer.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 96 }]}>
          <View style={[styles.toast, { backgroundColor: colors.text }]}>
            <Text style={[styles.message, { color: colors.background }]} numberOfLines={2}>
              {toast.message}
            </Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                style={styles.action}
              >
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {toast.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    maxWidth: 520,
  },
  message: { flexShrink: 1, fontSize: 14, fontWeight: '600' },
  action: { paddingVertical: 2, paddingHorizontal: 4 },
  actionText: { fontSize: 14, fontWeight: '800' },
});
