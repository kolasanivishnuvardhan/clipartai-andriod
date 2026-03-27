import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../../constants/colors";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getContainerStyle(variant: ButtonVariant): ViewStyle {
  const common: ViewStyle = {
    minHeight: 48,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  };

  if (variant === "primary") {
    return {
      ...common,
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    };
  }

  if (variant === "secondary") {
    return {
      ...common,
      backgroundColor: colors.surfaceHigh,
      borderColor: colors.border,
    };
  }

  return {
    ...common,
    backgroundColor: "transparent",
    borderColor: colors.border,
  };
}

function getLabelColor(variant: ButtonVariant): string {
  if (variant === "ghost") {
    return colors.accentLight;
  }
  return colors.textPrimary;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: isDisabled ? 0.55 : 1,
    };
  }, [isDisabled]);

  const handlePressIn: NonNullable<PressableProps["onPressIn"]> = (event: any) => {
    scale.value = withSpring(0.97, {
      damping: 18,
      stiffness: 320,
      mass: 0.4,
    });
    onPressIn?.(event);
  };

  const handlePressOut: NonNullable<PressableProps["onPressOut"]> = (event: any) => {
    scale.value = withSpring(1, {
      damping: 18,
      stiffness: 320,
      mass: 0.4,
    });
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[getContainerStyle(variant), fullWidth ? { width: "100%" } : null, style, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color={getLabelColor(variant)} />
      ) : (
        <Text
          style={[
            typography.body,
            {
              color: getLabelColor(variant),
              fontWeight: "600",
            },
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
