import { LayoutDashboard, Users, Award, Wallet } from "lucide-react-native";
import { RoleGuard } from "../../src/components/RoleGuard";
import { DashboardTabs } from "../../src/components/DashboardTabs";

export default function PartnerLayout() {
  return (
    <RoleGuard allowedRoles="partner">
      <DashboardTabs
        tabs={[
          { key: "partner-dashboard", label: "dashboard", icon: LayoutDashboard },
          { key: "partner-referrals", label: "referrals", icon: Users },
          { key: "partner-commissions", label: "commissions", icon: Award },
          { key: "partner-payouts", label: "payouts", icon: Wallet },
        ]}
      />
    </RoleGuard>
  );
}
