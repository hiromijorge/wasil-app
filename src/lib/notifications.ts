import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "./supabase";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted.");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });
  return tokenData.data;
}

export async function savePushToken(userId: string, token: string | null) {
  if (!token) return;
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
  if (error) console.error("Failed to save push token:", error);
}

export async function sendPushNotification(payload: {
  token: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  data?: Record<string, unknown>;
  lang?: "en" | "ar";
}) {
  const { error } = await supabase.functions.invoke("send-push-notification", {
    body: payload,
  });
  if (error) console.error("Failed to send push notification:", error);
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  if (Platform.OS === "web") return null;
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  if (Platform.OS === "web") return null;
  return Notifications.addNotificationResponseReceivedListener(callback);
}
