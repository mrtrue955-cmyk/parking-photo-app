import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';

export default function RootLayout() {
  useEffect(() => {
    registerPurgeTask().catch(() => {});
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
    </Stack>
  );
}
