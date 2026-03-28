import { useMemo } from "react";
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated from "react-native-reanimated";

import { Button } from "../src/components/ui/Button";
import { Card } from "../src/components/ui/Card";
import { ImagePreview } from "../src/components/ui/ImagePreview";
import { colors, spacing, typography } from "../src/constants/colors";
import { useImagePicker } from "../src/hooks/useImagePicker";
import { useGenerationStore, type GenerationState } from "../src/store/useGenerationStore";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

export default function HomeScreen() {
  const sourceImage = useGenerationStore((state: GenerationState) => state.sourceImage);
  const { isProcessing, pickFromCamera, pickFromGallery, clearImage } = useImagePicker();

  const hasImage = Boolean(sourceImage);

  const metadataText = useMemo(() => {
    if (!sourceImage) {
      return "No image selected";
    }
    return `${formatFileSize(sourceImage.fileSize)}  •  ${sourceImage.width}x${sourceImage.height}`;
  }, [sourceImage]);

  const onUploadPress = () => {
    Alert.alert("Upload photo", "Choose image source", [
      {
        text: "Camera",
        onPress: () => {
          void pickFromCamera();
        },
      },
      {
        text: "Gallery",
        onPress: () => {
          void pickFromGallery();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View
        style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}
      >
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Text style={[typography.heading1, { color: colors.textPrimary }]}>ClipartAI</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Turn photos into art</Text>
        </View>

        <View style={{ marginTop: spacing.x2l, alignItems: "center" }}>
          {!hasImage ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onUploadPress}
              style={{
                width: 280,
                height: 280,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: "dashed",
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 32 }}>📷</Text>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Tap to upload</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: "100%" }}>
              <ImagePreview uri={sourceImage!.uri} height={280} />
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                <Button
                  label="Change"
                  variant="secondary"
                  onPress={onUploadPress}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Clear"
                  variant="ghost"
                  onPress={clearImage}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>

        <Card style={{ marginTop: spacing.lg, paddingVertical: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}>
            {metadataText}
          </Text>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label={isProcessing ? "Processing..." : "Choose Styles →"}
            loading={isProcessing}
            disabled={!hasImage}
            onPress={() => router.push("/generate")}
          />
        </View>

        <View style={{ marginTop: "auto", paddingBottom: spacing.xl }}>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}>
            Your images are processed privately
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
