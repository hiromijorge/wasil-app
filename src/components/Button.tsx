import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { palette, fonts, radii } from "../lib/theme";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function Button({
  title,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variant === "primary" ? "default" : variant;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[v],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            v === "default" || v === "destructive"
              ? palette.primaryForeground
              : palette.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${v}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: radii.md,
  },
  default: {
    backgroundColor: palette.primary,
    ...{
      shadowColor: "#233338",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  destructive: {
    backgroundColor: palette.destructive,
  },
  secondary: {
    backgroundColor: palette.secondary,
  },
  outline: {
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  link: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    height: "auto",
    minHeight: 0,
  },
  defaultText: {
    color: palette.primaryForeground,
  },
  destructiveText: {
    color: palette.destructiveForeground,
  },
  secondaryText: {
    color: palette.secondaryForeground,
  },
  outlineText: {
    color: palette.foreground,
  },
  ghostText: {
    color: palette.foreground,
  },
  linkText: {
    color: palette.primary,
    textDecorationLine: "underline",
    textDecorationColor: palette.primary,
  },
  defaultSize: {
    height: 36,
    paddingHorizontal: 16,
  },
  sm: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.md,
  },
  lg: {
    height: 40,
    paddingHorizontal: 32,
    borderRadius: radii.md,
  },
  icon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  defaultTextSize: {
    fontSize: 14,
  },
  smText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 14,
  },
  iconText: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
