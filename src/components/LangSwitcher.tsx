import { Pressable, Text, StyleSheet } from "react-native";
import { useLang } from "../lib/i18n";
import { useAuth } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import { palette, fonts, radii } from "../lib/theme";

interface LangSwitcherProps {
  compact?: boolean;
}

export function LangSwitcher({ compact }: LangSwitcherProps) {
  const { lang, setLang } = useLang();
  const { user } = useAuth();

  const toggle = () => {
    const next = lang === "en" ? "ar" : "en";
    setLang(next);
    if (user) {
      supabase
        .from("profiles")
        .update({ language: next })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error("Failed to save language preference:", error);
        });
    }
  };

  return (
    <Pressable
      onPress={toggle}
      style={[styles.button, compact && styles.buttonCompact]}
      accessibilityRole="button"
    >
      <Text style={[styles.text, compact && styles.textCompact]}>
        {lang === "en" ? "AR" : "EN"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  buttonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  textCompact: {
    fontSize: 11,
  },
});
