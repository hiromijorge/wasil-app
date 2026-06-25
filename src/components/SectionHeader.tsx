import { View, Text, StyleSheet } from "react-native";
import { palette, fonts, spacing } from "../lib/theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ title, subtitle, centered }: SectionHeaderProps) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  centered: {
    alignItems: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
});
