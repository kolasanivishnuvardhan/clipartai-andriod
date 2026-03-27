import { useMemo } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "../src/constants/colors";
import { ToastHost } from "../src/components/ui/ToastHost";

export default function RootLayout() {
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "slide_from_right",
              animationDuration: Platform.OS === "android" ? 220 : 260,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
              animationTypeForReplace: "pop",
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="generate"
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="results"
              options={{
                animation: "slide_from_right",
              }}
            />
          </Stack>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
