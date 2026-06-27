import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Tajawal_400Regular,
  Tajawal_700Bold,
} from "@expo-google-fonts/tajawal";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, Text, StyleSheet } from "react-native";
import { AuthProvider } from "../src/lib/auth-context";
import { CartProvider } from "../src/lib/cart-context";
import { LangProvider } from "../src/lib/i18n";
import { CartDrawer } from "../src/components/CartDrawer";
import { NotificationListener } from "../src/components/NotificationListener";
import { palette, fonts } from "../src/lib/theme";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Tajawal_400Regular,
    Tajawal_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load fonts</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          <AuthProvider>
            <CartProvider>
              <View style={styles.root}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: palette.background,
                    },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="store/[id]" />
                  <Stack.Screen name="product/[id]" />
                  <Stack.Screen name="chat/[storeId]" />
                  <Stack.Screen name="checkout" />
                  <Stack.Screen name="order-success" />
                  <Stack.Screen name="send" />
                  <Stack.Screen name="parcel-success" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(merchant)" />
                  <Stack.Screen name="(driver)" />
                  <Stack.Screen name="(partner)" />
                  <Stack.Screen name="(admin)" />
                  <Stack.Screen name="dashboard" />
                  <Stack.Screen name="merchant-onboarding" />
                  <Stack.Screen name="merchant-chat/[customerId]" />
                  <Stack.Screen name="addresses" />
                  <Stack.Screen name="reset-password" />
                  <Stack.Screen name="verify-email" />
                  <Stack.Screen name="privacy-policy" />
                  <Stack.Screen name="terms-of-service" />
                </Stack>
                <CartDrawer />
                <NotificationListener />
                <StatusBar style="auto" />
              </View>
            </CartProvider>
          </AuthProvider>
        </LangProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  errorText: {
    fontFamily: fonts.sansSemiBold,
    color: palette.destructive,
    fontSize: 16,
  },
});
