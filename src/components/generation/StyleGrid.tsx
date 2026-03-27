import React from "react";
import { FlatList, View } from "react-native";

import { spacing } from "../../constants/colors";
import type { ClipArtStyle, StyleId } from "../../types";
import { StyleCard } from "./StyleCard";

interface StyleGridProps {
  styles: ClipArtStyle[];
  selectedStyleIds: StyleId[];
  onToggleStyle: (styleId: StyleId) => void;
}

export function StyleGrid({ styles, selectedStyleIds, onToggleStyle }: StyleGridProps) {
  return (
    <FlatList
      data={styles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.md }}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <StyleCard
          style={item}
          selected={selectedStyleIds.includes(item.id)}
          onToggle={onToggleStyle}
        />
      )}
    />
  );
}
