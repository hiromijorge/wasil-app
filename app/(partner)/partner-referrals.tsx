import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { usePartnerData } from "./_data";
import { useTranslation } from "../../src/lib/i18n";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardPage } from "../../src/components/DashboardLayout";
import { ReferredMerchantRow, sharedStyles } from "./_components";

export default function PartnerReferralsScreen() {
  const { t } = useTranslation();
  const { referrals, merchantProfiles, isLoading } = usePartnerData();

  return (
    <View style={sharedStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <DashboardPage>
          <Text style={sharedStyles.sectionTitle}>{t("referredMerchants")}</Text>
          {isLoading && (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />
          )}
          {referrals.length === 0 && !isLoading && (
            <Text style={sharedStyles.emptyText}>{t("noReferredMerchants")}</Text>
          )}
          {referrals.map((r) => (
            <ReferredMerchantRow
              key={r.id}
              referral={r}
              merchant={merchantProfiles[r.referred_merchant_id]}
            />
          ))}
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
