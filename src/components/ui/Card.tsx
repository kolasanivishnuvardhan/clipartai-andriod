import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { colors, radii, spacing } from "../../constants/colors";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  padding = spacing.lg,
  elevated = false,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? colors.surfaceHigh : colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.card,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
