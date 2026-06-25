import { LayoutDashboard, Receipt, CreditCard, Truck, Users, Settings } from "lucide-react-native";
import { RoleGuard } from "../../src/components/RoleGuard";
import { DashboardTabs, type DashboardTabItem } from "../../src/components/DashboardTabs";

const ADMIN_TABS: DashboardTabItem[] = [
  { key: "admin-dashboard", label: "dashboard", icon: LayoutDashboard },
  { key: "admin-payments", label: "orderPayments", icon: Receipt },
  { key: "admin-billing", label: "subscriptionBilling", icon: CreditCard },
  { key: "admin-drivers", label: "adminDriversTitle", icon: Truck },
  { key: "admin-referrals", label: "referrals", icon: Users },
  { key: "admin-config", label: "platformConfig", icon: Settings },
];

export default function AdminLayout() {
  return (
    <RoleGuard allowedRoles="admin">
      <DashboardTabs tabs={ADMIN_TABS} />
    </RoleGuard>
  );
}
