import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { colors, radii, spacing, typography } from "../../constants/colors";
import type { ClipArtStyle, GenerationResult } from "../../types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SkeletonLoader } from "../ui/SkeletonLoader";

interface ResultCardProps {
  styleMeta: ClipArtStyle;
  result: GenerationResult;
  index: number;
  onSave: (styleId: ClipArtStyle["id"], imageUrl: string) => void;
  onShare: (styleId: ClipArtStyle["id"], imageUrl: string) => void;
  onRetry: (styleId: ClipArtStyle["id"]) => void;
}

export function ResultCard({
  styleMeta,
  result,
  index,
  onSave,
  onShare,
  onRetry,
}: ResultCardProps) {
  const entry = useSharedValue(0);

  useEffect(() => {
    if (result.status === "success") {
      entry.value = withDelay(index * 90, withTiming(1, { duration: 260 }));
    }
  }, [entry, index, result.status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entry.value,
    transform: [{ translateY: (1 - entry.value) * 14 }],
  }));

  if (result.status === "loading") {
    return (
      <Card style={{ gap: spacing.md }}>
        <SkeletonLoader height={200} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={`${styleMeta.emoji} ${styleMeta.label}`} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Generating...</Text>
        </View>
      </Card>
    );
  }

  if (result.status === "error") {
    return (
      <Card style={{ gap: spacing.md }}>
        <View
          style={{
            height: 200,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceHigh,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Text style={[typography.body, { color: colors.textPrimary, textAlign: "center" }]}>
            Generation failed. Tap retry.
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Badge label={`${styleMeta.emoji} ${styleMeta.label}`} accent={false} />
          <Button
            label="Retry"
            variant="secondary"
            fullWidth={false}
            onPress={() => onRetry(styleMeta.id)}
          />
        </View>
      </Card>
    );
  }

  if (result.status !== "success" || !result.imageUrl) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Card style={{ gap: spacing.md }}>
        <View style={{ borderRadius: radii.card, overflow: "hidden" }}>
          <Image
            source={{ uri: result.imageUrl }}
            contentFit="cover"
            transition={200}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
          />
          <View style={{ position: "absolute", top: spacing.md, left: spacing.md }}>
            <Badge label={`${styleMeta.emoji} ${styleMeta.label}`} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button
            label="💾 Save"
            variant="secondary"
            onPress={() => onSave(styleMeta.id, result.imageUrl as string)}
            style={{ flex: 1 }}
          />
          <Button
            label="📤 Share"
            variant="secondary"
            onPress={() => onShare(styleMeta.id, result.imageUrl as string)}
            style={{ flex: 1 }}
          />
          <Button
            label="🔄 Retry"
            variant="ghost"
            onPress={() => onRetry(styleMeta.id)}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}
