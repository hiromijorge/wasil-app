import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageCircle,
  UserCircle,
} from "lucide-react-native";
import { RoleGuard } from "../../src/components/RoleGuard";
import { DashboardTabs, type DashboardTabItem } from "../../src/components/DashboardTabs";

const tabs: DashboardTabItem[] = [
  { key: "merchant-dashboard", label: "dashboard", icon: LayoutDashboard },
  { key: "merchant-products", label: "products", icon: Package },
  { key: "merchant-orders", label: "orders", icon: ShoppingBag },
  { key: "merchant-messages", label: "messages", icon: MessageCircle },
  { key: "merchant-account", label: "account", icon: UserCircle },
];

export default function MerchantLayout() {
  return (
    <RoleGuard allowedRoles="merchant">
      <DashboardTabs tabs={tabs} />
    </RoleGuard>
  );
}
