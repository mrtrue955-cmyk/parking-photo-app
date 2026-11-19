import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, StyleSheet, View } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';

type Props = { latitude: number; longitude: number; title: string; height?: number };

const ZOOM = 17;

/**
 * Read-only map of the parked spot. Apple Maps on iOS, Google Maps on Android —
 * routing stays in the user's maps app so the widget needs no API key.
 */
export function SpotMap({ latitude, longitude, title, height = 180 }: Props) {
  const { colors } = useTheme();
  const coordinates = { latitude, longitude };
  const cameraPosition = { coordinates, zoom: ZOOM };
  const markers = [{ id: 'spot', coordinates, title, systemImage: 'car.fill' }];

  return (
    <View
      accessible
      accessibilityLabel={title}
      pointerEvents="none"
      style={[
        styles.wrap,
        { height, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <AppleMaps.View style={styles.map} cameraPosition={cameraPosition} markers={markers} />
      ) : (
        <GoogleMaps.View style={styles.map} cameraPosition={cameraPosition} markers={markers} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.card, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  map: { flex: 1 },
});
