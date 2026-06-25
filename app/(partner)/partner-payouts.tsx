import { View, ScrollView } from "react-native";
import { usePartnerData } from "./_data";
import { spacing } from "../../src/lib/theme";
import { supabase } from "../../src/lib/supabase";
import { DashboardPage } from "../../src/components/DashboardLayout";
import { PayoutPanel, type PayoutRequestItem } from "../../src/components/PayoutPanel";
import { sharedStyles } from "./_components";

export default function PartnerPayoutsScreen() {
  const { profile, balance, minPayout, payoutRequests, refetchPayouts, requestPayout } =
    usePartnerData();

  return (
    <View style={sharedStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        <DashboardPage>
          <PayoutPanel
            availableBalance={balance}
            minPayout={minPayout}
            requests={(payoutRequests ?? []) as PayoutRequestItem[]}
            savedDetails={profile?.payout_details as Record<string, unknown> | null}
            onRequest={async (amount, details) => {
              if (!profile?.id) return;
              await requestPayout.mutateAsync({
                partnerId: profile.id,
                amountSar: amount,
                paymentMethod: "bank_transfer",
                paymentDetails: details,
              });
              refetchPayouts();
            }}
            onSaveDetails={(details) => {
              if (!profile?.id) return;
              supabase
                .from("profiles")
                .update({ payout_details: details })
                .eq("id", profile.id);
            }}
            loading={false}
            requestLoading={requestPayout.isPending}
          />
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
