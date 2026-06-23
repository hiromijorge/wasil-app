import { ReactNode } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, fonts, spacing, radii } from "../lib/theme";

const MD_BREAKPOINT = 768;

interface DashboardHeaderProps {
  overline?: string;
  title?: string;
  right?: ReactNode;
}

export function DashboardHeader({ overline, title, right }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.md },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.left}>
          {overline ? <Text style={styles.overline}>{overline}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

interface DashboardPageProps {
  children: ReactNode;
  style?: any;
  noPadding?: boolean;
}

export function DashboardPage({ children, style, noPadding }: DashboardPageProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  return (
    <View
      style={[
        styles.page,
        !noPadding && {
          paddingHorizontal: isDesktop ? spacing.xl : spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1152,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  overline: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
    marginTop: 2,
  },
  page: {
    maxWidth: 1152,
    alignSelf: "center",
    width: "100%",
  },
});
