import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { palette, fonts, spacing, radii } from "../src/lib/theme";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <Text style={styles.text}>
          Effective date: June 23, 2026{"\n\n"}
          Wasil ("we", "us", or "our") operates the Wasil mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the App.{"\n\n"}
          <Text style={styles.bold}>1. Information we collect</Text>{"\n\n"}
          Account information: name, email address, phone number, and optional profile photo.{"\n\n"}
          Location information: delivery/pickup addresses you save or enter, and device location when you choose to use "Use my current location".{"\n\n"}
          Payment information: bank transfer receipt images you upload. We do not collect credit/debit card information or bank account credentials.{"\n\n"}
          Device information: push notification token, device type, and operating system.{"\n\n"}
          Order and usage data: products you browse, cart, and purchase; messages exchanged with merchants; order history and delivery status.{"\n\n"}
          <Text style={styles.bold}>2. How we use your information</Text>{"\n\n"}
          We use your information to provide marketplace services, connect customers with merchants and drivers, verify payments, send order updates via push notifications, and improve the App.{"\n\n"}
          <Text style={styles.bold}>3. Sharing your information</Text>{"\n\n"}
          We share information only with merchants to fulfill orders, drivers to complete deliveries, and service providers such as Supabase for hosting, database, storage, and authentication. We do not sell your personal information.{"\n\n"}
          <Text style={styles.bold}>4. Data retention</Text>{"\n\n"}
          We retain your data for as long as your account is active or as needed to provide services. You may request account deletion by contacting us.{"\n\n"}
          <Text style={styles.bold}>5. Security</Text>{"\n\n"}
          We use industry-standard measures including Supabase authentication, Row Level Security (RLS), and encrypted connections. However, no method is 100% secure.{"\n\n"}
          <Text style={styles.bold}>6. Your choices</Text>{"\n\n"}
          You may update profile information in the App settings, disable push notifications in device settings, or contact us to delete your account.{"\n\n"}
          <Text style={styles.bold}>7. Children's privacy</Text>{"\n\n"}
          The App is not intended for users under 13. We do not knowingly collect data from children under 13.{"\n\n"}
          <Text style={styles.bold}>8. Changes to this policy</Text>{"\n\n"}
          We may update this policy. Changes will be posted here with an updated effective date.{"\n\n"}
          <Text style={styles.bold}>9. Contact us</Text>{"\n\n"}
          For questions or requests, contact aljofarinski@gmail.com.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  back: { padding: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  text: { fontFamily: fonts.sans, fontSize: 14, color: palette.foreground, lineHeight: 22 },
  bold: { fontFamily: fonts.sansBold },
});
