import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { palette, fonts, spacing, radii } from "../src/lib/theme";

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>Terms of Service</Text>
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
          Welcome to Wasil (the "App"). By using the App, you agree to these Terms of Service. If you do not agree, please do not use the App.{"\n\n"}
          <Text style={styles.bold}>1. Description of service</Text>{"\n\n"}
          Wasil is a marketplace platform that connects customers with local merchants and delivery drivers in Yemen. We provide the technology to browse stores, place orders, arrange deliveries, and process manual bank-transfer payments.{"\n\n"}
          <Text style={styles.bold}>2. Eligibility</Text>{"\n\n"}
          You must be at least 13 years old to use the App. Merchants and drivers must be legally able to operate their businesses in their jurisdiction.{"\n\n"}
          <Text style={styles.bold}>3. User accounts</Text>{"\n\n"}
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information, and you may not impersonate others or create fraudulent accounts.{"\n\n"}
          <Text style={styles.bold}>4. Orders and payments</Text>{"\n\n"}
          All prices are displayed in Saudi Riyals (SAR). Payments are made via manual bank transfer. Orders are processed after the admin verifies the uploaded receipt. Wasil acts as a facilitator and is not a party to the sale between customer and merchant.{"\n\n"}
          <Text style={styles.bold}>5. Merchant and driver responsibilities</Text>{"\n\n"}
          Merchants must provide accurate product information, pricing, and availability. Drivers must complete deliveries safely and in a timely manner. Users must comply with all applicable laws and regulations.{"\n\n"}
          <Text style={styles.bold}>6. Prohibited conduct</Text>{"\n\n"}
          You may not use the App to sell illegal, counterfeit, or harmful products; harass, abuse, or defraud other users; interfere with the App's operation or security; or upload false or misleading information.{"\n\n"}
          <Text style={styles.bold}>7. Cancellations and refunds</Text>{"\n\n"}
          Customers may cancel orders before payment verification or before the merchant begins preparation. Refunds are processed manually after admin review.{"\n\n"}
          <Text style={styles.bold}>8. Intellectual property</Text>{"\n\n"}
          The App, including its design, trademarks, and content, is owned by Wasil. You may not copy, modify, or distribute it without permission.{"\n\n"}
          <Text style={styles.bold}>9. Limitation of liability</Text>{"\n\n"}
          Wasil is provided "as is". We are not liable for disputes between users, product quality, delivery delays caused by third parties, or indirect damages.{"\n\n"}
          <Text style={styles.bold}>10. Termination</Text>{"\n\n"}
          We may suspend or terminate accounts that violate these terms or for operational reasons.{"\n\n"}
          <Text style={styles.bold}>11. Changes to terms</Text>{"\n\n"}
          We may update these terms. Continued use of the App after changes means you accept the updated terms.{"\n\n"}
          <Text style={styles.bold}>12. Governing law</Text>{"\n\n"}
          These terms are governed by the laws of the Republic of Yemen.{"\n\n"}
          <Text style={styles.bold}>13. Contact us</Text>{"\n\n"}
          For questions or support, contact aljofarinski@gmail.com.
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
