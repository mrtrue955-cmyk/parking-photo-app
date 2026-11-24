import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type ParkedSpotProps = {
  parked: boolean;
  parkedLabel: string;
  spot: string;
  daysLabel: string;
  emptyLabel: string;
  emptyHint: string;
  background: string;
  ink: string;
  muted: string;
  accent: string;
  /** Epoch ms of the meter limit; 0 when the driver set none. */
  timerEnd?: number;
};

/**
 * Rendered inside the widget extension, so everything it needs arrives through props:
 * no imports, hooks or module constants are available here.
 */
const ParkedSpot = (props: ParkedSpotProps, environment: WidgetEnvironment) => {
  'widget';
  const family = environment.widgetFamily;
  // SwiftUI renders `.timer` text by itself, so the countdown stays live without
  // the app pushing updates to the widget.
  const timerDate = props.timerEnd ? new Date(props.timerEnd) : null;
  const showTimer = timerDate !== null && timerDate.getTime() > Date.now();

  if (!props.parked) {
    if (family === 'accessoryInline') {
      return <Text>{props.emptyLabel}</Text>;
    }
    return (
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[padding({ all: 14 }), containerBackground(props.background, 'widget')]}
      >
        <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(props.muted)]}>
          {props.emptyLabel}
        </Text>
        <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle(props.ink)]}>
          {props.emptyHint}
        </Text>
      </VStack>
    );
  }

  if (family === 'accessoryInline') {
    return <Text>{`${props.spot} · ${props.daysLabel}`}</Text>;
  }

  if (family === 'accessoryCircular') {
    return (
      <VStack alignment="center" spacing={0}>
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(props.ink)]}>
          {props.spot}
        </Text>
      </VStack>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1}>
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(props.muted)]}>
          {props.parkedLabel}
        </Text>
        <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(props.ink)]}>
          {props.spot}
        </Text>
        <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(props.muted)]}>
          {props.daysLabel}
        </Text>
        {showTimer ? (
          <Text
            date={timerDate}
            dateStyle="timer"
            modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(props.accent)]}
          />
        ) : null}
      </VStack>
    );
  }

  return (
    <VStack
      alignment="leading"
      spacing={6}
      modifiers={[padding({ all: 16 }), containerBackground(props.background, 'widget')]}
    >
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(props.accent)]}>
        {props.parkedLabel}
      </Text>
      <Text
        modifiers={[
          font({ size: family === 'systemSmall' ? 30 : 34, weight: 'bold' }),
          foregroundStyle(props.ink),
          lineLimit(2),
        ]}
      >
        {props.spot}
      </Text>
      <Spacer />
      {showTimer ? (
        <Text
          date={timerDate}
          dateStyle="timer"
          modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(props.accent)]}
        />
      ) : null}
      <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(props.muted)]}>
        {props.daysLabel}
      </Text>
    </VStack>
  );
};

export default createWidget<ParkedSpotProps>('ParkedSpot', ParkedSpot, {
  // Seed so the gallery preview and the very first render are never blank,
  // before the app has pushed a snapshot.
  parked: false,
  parkedLabel: 'Đang đậu',
  spot: '',
  daysLabel: '',
  emptyLabel: 'Chưa lưu vị trí',
  emptyHint: 'Mở app để chụp cột',
  background: '#FBF7F0',
  ink: '#2B2724',
  muted: '#6F675F',
  accent: '#F5A524',
});
