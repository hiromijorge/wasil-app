import {
  View,
  Pressable,
  StyleSheet,
  type ViewProps,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
  type PressableStateCallbackType,
} from "react-native";
import { palette, spacing, radii, shadows } from "../lib/theme";

export interface CardStyleOptions {
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "card" | "lift" | "none";
  radius?: "xl" | "2xl" | "3xl";
  overflowHidden?: boolean;
}

function buildCardStyle(options: CardStyleOptions): ViewStyle[] {
  const { padding = "none", shadow = "card", radius = "2xl", overflowHidden } = options;
  const styles: ViewStyle[] = [baseStyles.base];

  if (padding === "sm") styles.push(baseStyles.paddingSm);
  if (padding === "md") styles.push(baseStyles.paddingMd);
  if (padding === "lg") styles.push(baseStyles.paddingLg);

  if (shadow === "card") styles.push(shadows.card);
  if (shadow === "lift") styles.push(shadows.lift);

  if (radius === "xl") styles.push(baseStyles.radiusXl);
  if (radius === "2xl") styles.push(baseStyles.radius2xl);
  if (radius === "3xl") styles.push(baseStyles.radius3xl);

  if (overflowHidden) styles.push(baseStyles.overflowHidden);

  return styles;
}

function combineStyles(
  base: ViewStyle[],
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
) {
  if (typeof style === "function") {
    return (state: PressableStateCallbackType) => [base, style(state)];
  }
  return [base, style];
}

export interface CardProps extends ViewProps, CardStyleOptions {}

export function Card({ padding, shadow, radius, overflowHidden, style, ...props }: CardProps) {
  return (
    <View
      style={[buildCardStyle({ padding, shadow, radius, overflowHidden }), style]}
      {...props}
    />
  );
}

export interface CardPressableProps extends PressableProps, CardStyleOptions {}

export function CardPressable({
  padding,
  shadow,
  radius,
  overflowHidden,
  style,
  ...props
}: CardPressableProps) {
  const base = buildCardStyle({ padding, shadow, radius, overflowHidden });
  return <Pressable style={combineStyles(base, style)} {...props} />;
}

const baseStyles = StyleSheet.create({
  base: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
  },
  paddingSm: {
    padding: spacing.sm,
  },
  paddingMd: {
    padding: spacing.md,
  },
  paddingLg: {
    padding: spacing.lg,
  },
  radiusXl: {
    borderRadius: radii.xl,
  },
  radius2xl: {
    borderRadius: radii["2xl"],
  },
  radius3xl: {
    borderRadius: radii["3xl"],
  },
  overflowHidden: {
    overflow: "hidden",
  },
});
