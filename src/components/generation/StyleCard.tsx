import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../../constants/colors";
import type { ClipArtStyle } from "../../types";

interface StyleCardProps {
  style: ClipArtStyle;
  selected: boolean;
  onToggle: (styleId: ClipArtStyle["id"]) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StyleCardBase({ style, selected, onToggle }: StyleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onToggle(style.id)}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 320, mass: 0.4 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320, mass: 0.4 });
      }}
      style={[
        {
          flex: 1,
          borderRadius: radii.card,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentGlow : colors.surface,
          padding: spacing.lg,
          minHeight: 128,
          gap: spacing.sm,
        },
        animatedStyle,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 22 }}>{style.emoji}</Text>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: selected ? colors.accent : colors.border,
            backgroundColor: selected ? colors.accent : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected ? <Text style={{ color: colors.textPrimary, fontSize: 12 }}>✓</Text> : null}
        </View>
      </View>

      <Text style={[typography.heading2, { color: colors.textPrimary, fontSize: 16 }]}>
        {style.label}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{style.description}</Text>
    </AnimatedPressable>
  );
}

export const StyleCard = memo(
  StyleCardBase,
  (prev: StyleCardProps, next: StyleCardProps) =>
    prev.style.id === next.style.id && prev.selected === next.selected,
);
