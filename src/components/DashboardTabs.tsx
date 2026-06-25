import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation, type TranslationKey } from "../lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";

export type DashboardTabItem = {
  key: string;
  label: TranslationKey;
  icon: React.ComponentType<{ size: number; color: string }>;
};

type TabBarProps = {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, any>;
  navigation: any;
};

export function DashboardTabs({
  tabs,
  badgeCounts,
}: {
  tabs: DashboardTabItem[];
  badgeCounts?: Record<string, number>;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: TabBarProps) => (
        <CustomTabBar
          {...props}
          tabs={tabs}
          badgeCounts={badgeCounts}
          isDesktop={isDesktop}
        />
      )}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.key}
          options={{ title: tab.label }}
        />
      ))}
    </Tabs>
  );
}

function CustomTabBar({
  state,
  descriptors,
  navigation,
  tabs,
  badgeCounts,
  isDesktop,
}: TabBarProps & {
  tabs: DashboardTabItem[];
  badgeCounts?: Record<string, number>;
  isDesktop: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const activeRouteName = state.routes[state.index].name;

  const renderTab = (tab: DashboardTabItem) => {
    const isActive = activeRouteName === tab.key;
    const Icon = tab.icon;
    const badge = badgeCounts?.[tab.key] ?? 0;
    const color = isActive ? palette.primary : palette.mutedForeground;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: tab.key,
        canPreventDefault: true,
      });
      if (!isActive && !event.defaultPrevented) {
        navigation.navigate(tab.key);
      }
    };

    return (
      <Pressable
        key={tab.key}
        onPress={onPress}
        style={[
          isDesktop ? desktopStyles.item : mobileStyles.item,
          isActive && (isDesktop ? desktopStyles.itemActive : mobileStyles.itemActive),
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <View style={isDesktop ? desktopStyles.iconWrap : mobileStyles.iconWrap}>
          <Icon size={isDesktop ? 20 : 22} color={color} />
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          )}
        </View>
        <Text style={[isDesktop ? desktopStyles.label : mobileStyles.label, { color }]}>
          {t(tab.label)}
        </Text>
      </Pressable>
    );
  };

  if (isDesktop) {
    return (
      <View style={[desktopStyles.container, { paddingTop: insets.top + spacing.md }]}>
        {tabs.map(renderTab)}
      </View>
    );
  }

  return (
    <View
      style={[
        mobileStyles.container,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
      ]}
    >
      {tabs.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.destructive,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: palette.primaryForeground,
  },
});

const mobileStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  itemActive: {
    // optional visual treatment
  },
  iconWrap: {
    position: "relative",
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
});

const desktopStyles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: palette.card,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
  itemActive: {
    backgroundColor: palette.primarySoft,
  },
  iconWrap: {
    position: "relative",
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
});
