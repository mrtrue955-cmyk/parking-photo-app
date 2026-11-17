import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../useTheme';

const SIZE = 28;
const THICKNESS = 5;
const INSET = 8;

const corners = [
  { top: INSET, left: INSET, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: 6 },
  { top: INSET, right: INSET, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: 6 },
  { bottom: INSET, left: INSET, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: 6 },
  { bottom: INSET, right: INSET, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: 6 },
] as const;

/** Overlays four yellow parking-bay corner brackets on its content. */
export function BayFrame({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      {children}
      {corners.map((corner, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[styles.corner, { borderColor: colors.bay }, corner]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: SIZE, height: SIZE },
});
