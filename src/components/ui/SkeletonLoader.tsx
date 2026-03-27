import React, { useEffect } from "react";
import { Dimensions, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radii } from "../../constants/colors";

interface SkeletonLoaderProps {
  height?: number;
  width?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  height = 200,
  width = Dimensions.get("window").width - 32,
  borderRadius = radii.card,
  style,
}: SkeletonLoaderProps) {
  const shimmerTranslate = useSharedValue(-300);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(300, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [shimmerTranslate]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          overflow: "hidden",
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 180,
            height: "100%",
          },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}
