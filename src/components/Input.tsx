import { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { palette, fonts, radii } from "../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, icon, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.container,
            focused && styles.focusedBorder,
            error && styles.errorBorder,
          ]}
        >
          {icon && <View style={styles.icon}>{icon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={palette.mutedForeground}
            style={[styles.input, icon ? styles.inputWithIcon : undefined, style]}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
    marginBottom: 6,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  focusedBorder: {
    borderColor: palette.ring,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
    paddingVertical: 10,
  },
  inputWithIcon: {
    marginLeft: 10,
  },
  icon: {
    opacity: 0.6,
  },
  errorBorder: {
    borderColor: palette.destructive,
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.destructive,
    marginTop: 6,
  },
});
