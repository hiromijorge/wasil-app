import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { usePartnerData } from "./_data";
import { useTranslation } from "../../src/lib/i18n";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardPage } from "../../src/components/DashboardLayout";
import { CommissionRowItem, sharedStyles } from "./_components";

export default function PartnerCommissionsScreen() {
  const { t } = useTranslation();
  const { commissions, isLoading } = usePartnerData();

  return (
    <View style={sharedStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <DashboardPage>
          <Text style={sharedStyles.sectionTitle}>{t("commissionHistory")}</Text>
          {isLoading && (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />
          )}
          {commissions.length === 0 && !isLoading && (
            <Text style={sharedStyles.emptyText}>{t("noCommissionsYet")}</Text>
          )}
          {commissions.map((c) => (
            <CommissionRowItem key={c.id} commission={c} />
          ))}
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
