import { LayoutDashboard, ClipboardList, Package, Wallet } from "lucide-react-native";
import { RoleGuard } from "../../src/components/RoleGuard";
import { DashboardTabs } from "../../src/components/DashboardTabs";
import type { DashboardTabItem } from "../../src/components/DashboardTabs";

const tabs: DashboardTabItem[] = [
  { key: "driver-dashboard", label: "dashboard", icon: LayoutDashboard },
  { key: "driver-deliveries", label: "deliveries", icon: ClipboardList },
  { key: "driver-parcels", label: "parcels", icon: Package },
  { key: "driver-payouts", label: "payouts", icon: Wallet },
];

export default function DriverLayout() {
  return (
    <RoleGuard allowedRoles="driver">
      <DashboardTabs tabs={tabs} />
    </RoleGuard>
  );
}
