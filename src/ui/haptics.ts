import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics are best effort: a simulator, a web build or a device with the
// feature disabled must never break the flow that asked for feedback.
function run(feedback: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  feedback().catch(() => undefined);
}

export function tapFeedback() {
  run(() => Haptics.selectionAsync());
}

export function impactFeedback() {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function successFeedback() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function warningFeedback() {
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
