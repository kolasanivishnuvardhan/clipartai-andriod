import { useEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";

import { StyleGrid } from "../src/components/generation/StyleGrid";
import { Button } from "../src/components/ui/Button";
import { colors, spacing, typography } from "../src/constants/colors";
import { CLIPART_STYLES } from "../src/constants/styles";
import { useGeneration } from "../src/hooks/useGeneration";
import { useGenerationStore, type GenerationState } from "../src/store/useGenerationStore";

export default function GenerateScreen() {
  const sourceImage = useGenerationStore((state: GenerationState) => state.sourceImage);
  const selectedStyles = useGenerationStore((state: GenerationState) => state.selectedStyles);
  const toggleStyle = useGenerationStore((state: GenerationState) => state.toggleStyle);

  const { generateSelected, isGenerating } = useGeneration();

  const selectedCount = selectedStyles.length;

  useEffect(() => {
    if (!sourceImage) {
      router.replace("/");
    }
  }, [sourceImage]);

  const handleGenerate = () => {
    router.push("/results");
    void generateSelected();
  };

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
          <Text style={[typography.heading2, { color: colors.textPrimary }]}>Choose Your Styles</Text>
          <View style={{ width: 48 }} />
        </View>

        {sourceImage ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.lg }}>
            <Image
              source={{ uri: sourceImage.uri }}
              contentFit="cover"
              transition={140}
              style={{ width: 60, height: 60, borderRadius: 12 }}
            />
            <TouchableOpacity onPress={() => router.replace("/")} style={{ marginLeft: spacing.md }}>
              <Text style={[typography.body, { color: colors.accentLight }]}>Change photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Select styles to generate
        </Text>

        <StyleGrid
          styles={CLIPART_STYLES}
          selectedStyleIds={selectedStyles}
          onToggleStyle={toggleStyle}
        />

        <View style={{ marginTop: "auto", paddingBottom: spacing.xl }}>
          <Button
            label={`Generate ${selectedCount} Styles`}
            disabled={selectedCount === 0 || isGenerating}
            loading={isGenerating}
            onPress={handleGenerate}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
