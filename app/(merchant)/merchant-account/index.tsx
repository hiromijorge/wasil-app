import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Store, CreditCard, Wallet, LogOut, ChevronRight } from "lucide-react-native";
import { MerchantShell } from "../../../src/components/MerchantShell";
import { useAuth } from "../../../src/lib/auth-context";
import { useTranslation } from "../../../src/lib/i18n";
import { palette } from "../../../src/lib/theme";
import { merchantStyles } from "../_components";

export default function AccountIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <MerchantShell>
      <View style={merchantStyles.tabContent}>
        <Text style={merchantStyles.tabTitle}>{t("accountTab")}</Text>
        <Text style={merchantStyles.tabSubtitle}>{t("accountSubtitle")}</Text>

        <View style={[merchantStyles.card]}>
          <Text style={merchantStyles.menuSectionTitle}>{t("storeSection")}</Text>
          <AccountMenuRow
            icon={Store}
            label={t("accountMenuProfile")}
            onPress={() => router.push("/merchant-account/profile")}
          />
          <AccountMenuRow
            icon={CreditCard}
            label={t("accountMenuBilling")}
            onPress={() => router.push("/merchant-account/billing")}
          />
        </View>

        <View style={[merchantStyles.card]}>
          <Text style={merchantStyles.menuSectionTitle}>{t("financesSection")}</Text>
          <AccountMenuRow
            icon={Wallet}
            label={t("accountMenuPayouts")}
            onPress={() => router.push("/merchant-account/payouts")}
          />
          <AccountMenuRow
            icon={LogOut}
            label={t("signOut")}
            onPress={signOut}
            destructive
          />
        </View>
      </View>
    </MerchantShell>
  );
}

function AccountMenuRow({
  icon: Icon,
  label,
  onPress,
  destructive,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={merchantStyles.accountMenuRow}>
      <View
        style={[
          merchantStyles.accountMenuIcon,
          destructive && { backgroundColor: `${palette.destructive}12` },
        ]}
      >
        <Icon
          size={18}
          color={destructive ? palette.destructive : palette.primary}
        />
      </View>
      <Text
        style={[
          merchantStyles.accountMenuLabel,
          destructive && { color: palette.destructive },
        ]}
      >
        {label}
      </Text>
      <ChevronRight size={18} color={palette.mutedForeground} />
    </Pressable>
  );
}
