import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MerchantShell } from "../../src/components/MerchantShell";
import { useMerchantConversations } from "../../src/hooks/useMerchantConversations";
import { useTranslation } from "../../src/lib/i18n";
import { palette, shadows } from "../../src/lib/theme";
import { merchantStyles } from "./_components";

export default function MessagesTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: conversations, isLoading: conversationsLoading } =
    useMerchantConversations();

  return (
    <MerchantShell>
      <View style={merchantStyles.tabContent}>
        <Text style={merchantStyles.tabTitle}>{t("messagesTab")}</Text>
        {conversationsLoading && (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
        )}
        {!conversationsLoading && conversations.length === 0 && (
          <Text style={merchantStyles.emptyText}>{t("noMessagesYet")}</Text>
        )}
        {conversations.map((c) => (
          <Pressable
            key={c.customer_id}
            onPress={() => router.push(`/merchant-chat/${c.customer_id}`)}
            style={[merchantStyles.orderCard, shadows.card]}
            accessibilityRole="button"
          >
            <View style={merchantStyles.orderRow}>
              <View>
                <Text style={merchantStyles.orderId}>{c.customer_name}</Text>
                <Text style={merchantStyles.orderMetaText} numberOfLines={1}>
                  {c.last_message.content}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                {c.unread_count > 0 && (
                  <View style={merchantStyles.unreadBadge}>
                    <Text style={merchantStyles.unreadText}>
                      {c.unread_count}
                    </Text>
                  </View>
                )}
                <Text style={merchantStyles.orderMetaText}>
                  {new Date(c.last_message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </MerchantShell>
  );
}
