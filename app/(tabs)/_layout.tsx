import { Pressable, View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Home, Search, Store, ClipboardList, User } from "lucide-react-native";
import { palette, fonts, spacing, radii } from "../../src/lib/theme";

const MD_BREAKPOINT = 768;
const COMPACT_BREAKPOINT = 360;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const isCompact = width < COMPACT_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarShowLabel: !isCompact,
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
          height: isCompact ? 56 : 64,
          paddingBottom: isCompact ? 6 : 8,
          paddingTop: isCompact ? 8 : 6,
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
          title: "Activity",
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardList size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
