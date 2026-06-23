import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, AlertCircle } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { usePlatformConfig } from "../src/hooks/usePlatformConfig";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";

export default function AdminConfigScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role, loading: authLoading } = useAuth();
  const { data, isLoading, refresh, updateConfig } = usePlatformConfig();

  const [commission, setCommission] = useState("");
  const [minCommission, setMinCommission] = useState("");
  const [partnerCommission, setPartnerCommission] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setCommission(String(data.commission_percent ?? ""));
      setMinCommission(String(data.minimum_commission_sar ?? ""));
      setPartnerCommission(String(data.partner_commission_percent ?? ""));
    }
  }, [data]);

  const isAdmin = role === "admin";

  const handleSave = async () => {
    setMessage(null);
    const commissionNum = Number(commission);
    const minCommissionNum = Number(minCommission);
    const partnerNum = Number(partnerCommission);

    if (
      Number.isNaN(commissionNum) ||
      Number.isNaN(minCommissionNum) ||
      Number.isNaN(partnerNum)
    ) {
      setMessage("Please enter valid numbers.");
      return;
    }

    setSaving(true);
    const result = await updateConfig({
      commission_percent: commissionNum,
      minimum_commission_sar: minCommissionNum,
      partner_commission_percent: partnerNum,
    });
    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage("Settings saved.");
      await refresh();
    }
  };

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={palette.foreground} />
          </Pressable>
          <View>
            <Text style={styles.headerOverline}>Merchant Console</Text>
            <Text style={styles.headerTitle}>Platform Config</Text>
          </View>
        </View>
      </View>

      {!isAdmin ? (
        <View style={styles.centered}>
          <AlertCircle size={48} color={palette.destructive} />
          <Text style={styles.deniedTitle}>Access Denied</Text>
          <Text style={styles.deniedText}>
            You must be signed in as an admin to view this screen.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
          }}
        >
          <View>
            <Text style={styles.title}>Platform Config</Text>
            <Text style={styles.subtitle}>
              Adjust platform commission settings
            </Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Input
              label="Commission %"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={commission}
              onChangeText={setCommission}
            />
            <Input
              label="Minimum commission (SAR)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={minCommission}
              onChangeText={setMinCommission}
            />
            <Input
              label="Partner commission %"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={partnerCommission}
              onChangeText={setPartnerCommission}
            />

            {message && (
              <Text
                style={[
                  styles.message,
                  message.startsWith("Settings") ? styles.success : styles.error,
                ]}
              >
                {message}
              </Text>
            )}

            <Button
              title="Save settings"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  headerOverline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  iconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  deniedTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  deniedText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  message: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  success: {
    color: palette.success,
  },
  error: {
    color: palette.destructive,
  },
});
