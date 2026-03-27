import React from "react";
import { Text, View, type ViewStyle } from "react-native";

import { colors, spacing, typography } from "../../constants/colors";

interface BadgeProps {
  label: string;
  accent?: boolean;
  style?: ViewStyle;
}

export function Badge({ label, accent = true, style }: BadgeProps) {
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: accent ? colors.accent : colors.border,
          backgroundColor: accent ? colors.accentGlow : colors.surfaceHigh,
        },
        style,
      ]}
    >
      <Text
        style={[
          typography.caption,
          {
            color: accent ? colors.accentLight : colors.textSecondary,
            fontWeight: "600",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
