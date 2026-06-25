import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";


export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (typeof Notifications.getLastNotificationResponseAsync !== "function") return;
    if (typeof Notifications.addNotificationResponseReceivedListener !== "function") return;

    let listener: Notifications.Subscription | null = null;
    let mounted = true;

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!mounted || !response?.notification) return;
        handleNotification(response.notification);
      })
      .catch(() => {
        // ignore on platforms where this API is unavailable
      });

    listener = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotification(response.notification);
    });

    function handleNotification(notification: Notifications.Notification) {
      const data = notification.request.content.data as
        | { type?: string; parcelId?: string; orderId?: string; storeId?: string; customerId?: string }
        | undefined;

      if (!data) return;

      if (data.type === "parcel" && data.parcelId) {
        router.push(`/parcel/${data.parcelId}`);
      } else if (data.type === "message" && data.storeId) {
        router.push(`/chat/${data.storeId}`);
      }
    }

    return () => {
      mounted = false;
      listener?.remove();
    };
  }, [router]);

  return null;
}
