import { useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ResultCard } from "../src/components/generation/ResultCard";
import { Badge } from "../src/components/ui/Badge";
import { Button } from "../src/components/ui/Button";
import { colors, spacing, typography } from "../src/constants/colors";
import { CLIPART_STYLES } from "../src/constants/styles";
import { useDownload } from "../src/hooks/useDownload";
import { useGeneration } from "../src/hooks/useGeneration";
import { useGenerationStore, type GenerationState } from "../src/store/useGenerationStore";
import type { ClipArtStyle, StyleId } from "../src/types";

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();

  const sourceImage = useGenerationStore((state: GenerationState) => state.sourceImage);
  const selectedStyles = useGenerationStore((state: GenerationState) => state.selectedStyles);
  const results = useGenerationStore((state: GenerationState) => state.results);

  const { retryStyle, progressLabel } = useGeneration();
  const { saveOne, shareOne, saveAll, isSavingAll, saveAllProgress } = useDownload();

  useEffect(() => {
    if (!sourceImage) {
      router.replace("/");
      return;
    }

    if (selectedStyles.length === 0) {
      router.replace("/generate");
    }
  }, [selectedStyles.length, sourceImage]);

  const selectedStyleModels = useMemo(() => {
    return selectedStyles
      .map((styleId: StyleId) =>
        CLIPART_STYLES.find((style: ClipArtStyle) => style.id === styleId),
      )
      .filter(Boolean)
      .map((style: ClipArtStyle | undefined) => style as ClipArtStyle);
  }, [selectedStyles]);

  const successfulCount = useMemo(() => {
    return selectedStyles.reduce((acc: number, styleId: StyleId) => {
      return results[styleId].status === "success" ? acc + 1 : acc;
    }, 0);
  }, [results, selectedStyles]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View
        entering={FadeInDown.duration(220)}
        style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.lg,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[typography.body, { color: colors.accentLight }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[typography.heading2, { color: colors.textPrimary }]}>Your Clipart</Text>
          <Badge label={progressLabel} />
        </View>

        {sourceImage ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <Image
              source={{ uri: sourceImage.uri }}
              contentFit="cover"
              transition={150}
              style={{ width: 52, height: 52, borderRadius: 12 }}
            />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Original</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: "auto" }]}>
              {successfulCount}/{selectedStyles.length} ready
            </Text>
          </View>
        ) : null}

        <FlashList
          data={selectedStyleModels}
          keyExtractor={(item: ClipArtStyle) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.x2l }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item, index }: { item: ClipArtStyle; index: number }) => (
            <ResultCard
              styleMeta={item}
              result={results[item.id as StyleId]}
              index={index}
              onRetry={(styleId) => {
                void retryStyle(styleId);
              }}
              onSave={(styleId, imageUrl) => {
                void saveOne(styleId, imageUrl);
              }}
              onShare={(styleId, imageUrl) => {
                void shareOne(styleId, imageUrl);
              }}
            />
          )}
        />

        <View
          style={{
            paddingBottom: Math.max(insets.bottom, spacing.lg),
            paddingTop: spacing.sm,
          }}
        >
          <Button
            label={
              isSavingAll
                ? `Saving ${saveAllProgress.completed}/${saveAllProgress.total}`
                : "Save All"
            }
            loading={isSavingAll}
            onPress={() => {
              void saveAll();
            }}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
