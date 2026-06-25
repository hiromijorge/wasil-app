import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { useMerchantStore } from "../../src/hooks/useMerchantStore";
import { useAuth } from "../../src/lib/auth-context";
import { useTranslation } from "../../src/lib/i18n";
import { supabase } from "../../src/lib/supabase";
import { RoleGuard } from "../../src/components/RoleGuard";
import type { Database } from "../../src/lib/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

function MerchantChatScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();

  const { data: store } = useMerchantStore();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState(t("customer"));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const storeId = store?.id;

  useEffect(() => {
    if (!storeId || !customerId) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      const [{ data: msgs, error: msgError }, { data: profile }] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .eq("store_id", storeId)
          .eq("customer_id", customerId)
          .order("created_at", { ascending: true }),
        supabase.from("profiles").select("full_name").eq("id", customerId).single(),
      ]);

      if (!ignore) {
        if (!msgError && msgs) setMessages(msgs as MessageRow[]);
        if (profile) setCustomerName((profile as any).full_name ?? t("customer"));
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`merchant-chat:${storeId}:${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageRow;
          if (newMessage.customer_id !== customerId) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [storeId, customerId, t]);

  const send = async () => {
    const text = input.trim();
    if (!text || !storeId || !customerId || !user) return;

    setSending(true);
    setInput("");

    const { error } = await supabase.from("messages").insert({
      store_id: storeId,
      customer_id: customerId,
      sender_id: user.id,
      sender_role: "merchant",
      content: text,
    });

    if (error) {
      setInput(text);
    }
    setSending(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ArrowLeft size={20} color={palette.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.storeName}>{customerName}</Text>
          <Text style={styles.status}>{t("conversationWith", { name: store?.name ?? t("store") })}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <Text style={styles.emptyText}>
              {t("startConversation", { name: customerName })}
            </Text>
          )}
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.sender_role === "merchant"
                  ? styles.bubbleMerchant
                  : styles.bubbleCustomer,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.sender_role === "merchant" && styles.bubbleTextMerchant,
                ]}
              >
                {m.content}
              </Text>
              <Text style={styles.time}>{formatTime(m.created_at)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder={t("typeMessage")}
          placeholderTextColor={palette.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <Pressable
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={send}
          disabled={!input.trim() || sending}
          accessibilityRole="button"
        >
          <Send size={18} color={palette.primaryForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: `${palette.background}D9`,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.border}B3`,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  storeName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  status: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  placeholder: {
    width: 40,
  },
  messages: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  bubble: {
    maxWidth: "80%",
    padding: spacing.md,
    borderRadius: radii["2xl"],
    gap: spacing.xs,
  },
  bubbleCustomer: {
    alignSelf: "flex-start",
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderTopLeftRadius: radii.sm,
  },
  bubbleMerchant: {
    alignSelf: "flex-end",
    backgroundColor: palette.primary,
    borderTopRightRadius: radii.sm,
  },
  bubbleText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    color: palette.foreground,
  },
  bubbleTextMerchant: {
    color: palette.primaryForeground,
  },
  time: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: palette.mutedForeground,
    alignSelf: "flex-end",
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default function MerchantChatScreenWrapped() {
  return (
    <RoleGuard allowedRoles="merchant">
      <MerchantChatScreen />
    </RoleGuard>
  );
}
