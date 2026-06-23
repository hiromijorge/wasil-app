import { Pressable, View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, Store, Package, ShoppingCart } from "lucide-react-native";
import { palette, fonts, spacing, radii } from "../../src/lib/theme";
import { useCart } from "../../src/lib/cart-context";

const MD_BREAKPOINT = 768;

function CartTabButton() {
  const { itemCount, openCart } = useCart();
  const count = itemCount > 9 ? "9+" : String(itemCount);

  return (
    <Pressable style={styles.tabItem} onPress={openCart}>
      <View style={styles.iconWrap}>
        <ShoppingCart size={22} color={palette.mutedForeground} strokeWidth={2} />
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>Cart</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          display: isDesktop ? "none" : "flex",
          backgroundColor: `${palette.card}E6`,
          borderTopColor: `${palette.border}B3`,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: "#233338",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size, focused }) => (
            <Search size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarButton: () => <CartTabButton />,
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: "Stores",
          tabBarIcon: ({ color, size, focused }) => (
            <Store size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size, focused }) => (
            <Package size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconWrap: {
    position: "relative",
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: palette.card,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: palette.primaryForeground,
  },
});
