import { Link } from 'expo-router';
import { View } from 'react-native';

export default function Home() {
  return (
    <View style={{ padding: 24 }}>
      <Link href="/capture">Chụp vị trí xe</Link>
    </View>
  );
}
