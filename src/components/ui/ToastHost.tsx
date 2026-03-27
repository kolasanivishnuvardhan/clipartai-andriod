import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing, typography } from "../../constants/colors";
import { useUIStore, type ToastMessage, type ToastType, type UIState } from "../../store/useUIStore";

function getToastBackground(type: ToastType): string {
  if (type === "success") {
    return "rgba(16, 185, 129, 0.16)";
  }
  if (type === "error") {
    return "rgba(239, 68, 68, 0.16)";
  }
  return colors.surfaceHigh;
}

function getToastBorder(type: ToastType): string {
  if (type === "success") {
    return colors.success;
  }
  if (type === "error") {
    return colors.error;
  }
  return colors.border;
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dismissToast = useUIStore((state: UIState) => state.dismissToast);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => {
      dismissToast(toast.id);
    }, toast.durationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [dismissToast, opacity, toast.durationMs, toast.id, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          borderRadius: 12,
          borderWidth: 1,
          borderColor: getToastBorder(toast.type),
          backgroundColor: getToastBackground(toast.type),
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          marginTop: spacing.sm,
        },
        animatedStyle,
      ]}
    >
      <Text style={[typography.body, { color: colors.textPrimary }]}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastHost() {
  const toasts = useUIStore((state: UIState) => state.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom: spacing.xl,
        zIndex: 999,
      }}
    >
      {toasts.map((toast: ToastMessage) => (
        <View key={toast.id}>
          <ToastItem toast={toast} />
        </View>
      ))}
    </View>
  );
}
