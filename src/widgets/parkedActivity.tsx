import { HStack, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type ParkedActivityProps = {
  parkedLabel: string;
  spot: string;
  startedLabel: string;
  daysLabel: string;
  accent: string;
  ink: string;
  muted: string;
};

/**
 * Lock Screen + Dynamic Island presentation of the current spot. Runs in the
 * widget runtime, so every string and colour arrives through props.
 */
const ParkedActivity = (props: ParkedActivityProps, environment: LiveActivityEnvironment) => {
  'widget';
  // The Lock Screen backdrop is system-provided (dark in dark mode), so text must
  // follow the semantic styles instead of the light-theme palette.
  const primary = { type: 'hierarchical' as const, style: 'primary' as const };
  const secondary = { type: 'hierarchical' as const, style: 'secondary' as const };
  const accent = environment.isLuminanceReduced
    ? { type: 'hierarchical' as const, style: 'primary' as const }
    : props.accent;

  return {
    banner: (
      <VStack modifiers={[padding({ all: 14 })]} alignment="leading" spacing={3}>
        <HStack spacing={6}>
          <Image systemName="car.fill" color={props.accent} size={14} />
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(accent)]}>
            {props.parkedLabel}
          </Text>
        </HStack>
        <Text modifiers={[font({ size: 26, weight: 'bold' }), foregroundStyle(primary)]}>
          {props.spot}
        </Text>
        <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundStyle(secondary)]}>
          {props.startedLabel} · {props.daysLabel}
        </Text>
      </VStack>
    ),
    compactLeading: <Image systemName="car.fill" color={props.accent} />,
    compactTrailing: <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>{props.spot}</Text>,
    minimal: <Image systemName="car.fill" color={props.accent} />,
    expandedLeading: (
      <VStack modifiers={[padding({ all: 10 })]} spacing={2}>
        <Image systemName="car.fill" color={props.accent} size={18} />
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>
          {props.parkedLabel}
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack modifiers={[padding({ all: 10 })]} spacing={2}>
        <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle(primary)]}>
          {props.spot}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>{props.daysLabel}</Text>
      </VStack>
    ),
    expandedBottom: (
      <HStack modifiers={[padding({ all: 10 })]} spacing={6}>
        <Image systemName="clock" color={props.muted} size={12} />
        <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary)]}>
          {props.startedLabel}
        </Text>
      </HStack>
    ),
  };
};

export default createLiveActivity<ParkedActivityProps>('ParkedActivity', ParkedActivity);
