import React from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";

import { colors, radii, spacing } from "../../constants/colors";
import type { ClipArtStyle, GenerationResult } from "../../types";
import { Badge } from "../ui/Badge";

interface ResultsCarouselProps {
  items: Array<{ style: ClipArtStyle; result: GenerationResult }>;
}

export function ResultsCarousel({ items }: ResultsCarouselProps) {
  const successful = items.filter(
    (item) => item.result.status === "success" && Boolean(item.result.imageUrl),
  );

  if (successful.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: spacing.lg }}
    >
      {successful.map(({ style, result }) => (
        <View
          key={style.id}
          style={{
            width: 240,
            marginRight: spacing.md,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: result.imageUrl as string }}
            contentFit="cover"
            transition={180}
            style={{ width: "100%", height: 140 }}
          />
          <View style={{ padding: spacing.md }}>
            <Badge label={`${style.emoji} ${style.label}`} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
