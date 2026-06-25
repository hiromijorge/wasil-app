import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Share2,
  Check,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { usePartnerData } from "./_data";
import { useTranslation } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardHeader, DashboardPage } from "../../src/components/DashboardLayout";
import { sharedStyles } from "./_components";

export default function PartnerDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    signOut,
    profile,
    referrals,
    totalEarned,
    pending,
    partnerPercent,
    referralCode,
  } = usePartnerData();
  const [copied, setCopied] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const message = t("referralShareMessage", {
      code: referralCode,
      percent: partnerPercent,
    });
    await Clipboard.setStringAsync(message);
    Alert.alert(t("copyCode"), t("shareMessageCopied"));
  };

  return (
    <View style={sharedStyles.container}>
      <DashboardHeader
        overline={t("partnerConsole")}
        title={profile?.full_name ?? t("role_partner")}
        right={
          <Pressable onPress={handleSignOut} style={sharedStyles.signOutButton}>
            <Text style={sharedStyles.signOutText}>{t("signOut")}</Text>
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <DashboardPage>
          <View style={[sharedStyles.referralCard]}>
            <Text style={sharedStyles.referralLabel}>
              {t("yourReferralCode")}
            </Text>
            <Text style={sharedStyles.referralCode}>{referralCode}</Text>
            <Text style={sharedStyles.referralHint}>
              {t("referralHint", { percent: partnerPercent })}
            </Text>
            <View style={sharedStyles.referralActions}>
              <Pressable
                onPress={handleCopy}
                style={sharedStyles.referralAction}
                accessibilityRole="button"
              >
                {copied ? (
                  <Check size={18} color="#fff" />
                ) : (
                  <Copy size={18} color="#fff" />
                )}
                <Text style={sharedStyles.referralActionText}>
                  {copied ? t("copied") : t("copyCode")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={sharedStyles.referralAction}
                accessibilityRole="button"
              >
                <Share2 size={18} color="#fff" />
                <Text style={sharedStyles.referralActionText}>
                  {t("share")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={sharedStyles.statsGrid}>
            <View style={sharedStyles.statCard}>
              <Users size={20} color={palette.primary} />
              <Text style={sharedStyles.statValue}>{referrals.length}</Text>
              <Text style={sharedStyles.statLabel}>{t("referrals")}</Text>
            </View>
            <View style={sharedStyles.statCard}>
              <DollarSign size={20} color={palette.success} />
              <Text style={sharedStyles.statValue}>
                {formatSAR(totalEarned)}
              </Text>
              <Text style={sharedStyles.statLabel}>{t("paid")}</Text>
            </View>
            <View style={sharedStyles.statCard}>
              <TrendingUp size={20} color={palette.warning} />
              <Text style={sharedStyles.statValue}>{formatSAR(pending)}</Text>
              <Text style={sharedStyles.statLabel}>{t("pending")}</Text>
            </View>
          </View>
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
