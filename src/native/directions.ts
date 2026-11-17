import { Platform } from 'react-native';

export function directionsUrl(lat: number, lng: number): string {
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
