import { Pressable, Text, StyleSheet } from "react-native";
import { useLang } from "../lib/i18n";
import { palette, fonts, radii } from "../lib/theme";

export function LangSwitcher() {
  const { lang, setLang } = useLang();

  const toggle = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  return (
    <Pressable onPress={toggle} style={styles.button} accessibilityRole="button">
      <Text style={styles.text}>{lang === "en" ? "AR" : "EN"}</Text>
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
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
});
