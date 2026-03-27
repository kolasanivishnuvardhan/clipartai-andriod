import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";

import { colors, radii } from "../../constants/colors";

interface ImagePreviewProps {
  uri: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ImagePreview({ uri, height = 280, style }: ImagePreviewProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event: any) => {
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event: any) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 240 });
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const nextScale = scale.value > 1 ? 1 : 2;
      scale.value = withSpring(nextScale, { damping: 18, stiffness: 260 });
      savedScale.value = nextScale;
      if (nextScale === 1) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 240 });
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, panGesture),
    pinchGesture,
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <View
      style={[
        {
          width: "100%",
          height,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.card,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ width: "100%", height: "100%" }, animatedStyle]}>
          <Image
            source={{ uri }}
            contentFit="cover"
            transition={180}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
