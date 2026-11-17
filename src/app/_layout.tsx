import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
    </Stack>
  );
}
