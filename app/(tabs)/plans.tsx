import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { TopBar } from "../../src/components/TopBar";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { formatSAR } from "../../src/lib/demo-data";
import { useAuth } from "../../src/lib/auth-context";

const MD_BREAKPOINT = 768;

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 100,
    badge: null,
    popular: false,
    features: ["Up to 50 products", "Basic storefront", "In-app orders", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 300,
    badge: null,
    popular: true,
    features: [
      "Unlimited products",
      "Featured placement",
      "Escrow payouts",
      "Priority support",
      "Sales analytics",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 500,
    badge: "Best value",
    popular: false,
    features: [
      "Everything in Growth",
      "Top home-page placement",
      "Multiple staff accounts",
      "Marketing tools",
      "Dedicated manager",
    ],
  },
];

export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const { session } = useAuth();

  const handleSubscribe = (planId: string) => {
    if (!session) {
      router.push("/auth");
      return;
    }
    router.push({ pathname: "/checkout", params: { plan: planId } } as any);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Plans" showBack onBack={() => router.push("/(tabs)/")} showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.intro}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>For merchants</Text>
            </View>
            <Text style={styles.title}>
              Plans that <Text style={styles.titleAccent}>scale with you</Text>
            </Text>
            <Text style={styles.subtitle}>
              Choose a subscription to unlock your merchant dashboard and start accepting orders.
            </Text>
            <View style={styles.feePill}>
              <Text style={styles.feePillText}>💳 Plus 5% transaction fee</Text>
            </View>
          </View>

          <View style={[styles.plansList, isDesktop && styles.plansListDesktop]}>
            {plans.map((plan) => (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isDesktop && styles.planCardDesktop,
                  plan.popular && styles.planCardPopular,
                ]}
              >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>⭐ Most popular</Text>
                </View>
              )}
              {plan.badge && !plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: palette.warning }]}>
                  <Text style={styles.popularBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPeriod}>per month</Text>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatSAR(plan.price)}</Text>
                {plan.price > 0 && <Text style={styles.priceUnit}>/mo</Text>}
              </View>

              <View style={styles.features}>
                {plan.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.check}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.subscribeButton,
                  plan.popular && styles.subscribeButtonPrimary,
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                <Text
                  style={[
                    styles.subscribeButtonText,
                    plan.popular && styles.subscribeButtonTextPrimary,
                  ]}
                >
                  {plan.price === 0 ? "Start free" : "Choose plan"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Questions?</Text>
          <Text style={styles.helpText}>We can help you choose the right plan.</Text>
          <Pressable
            style={styles.helpButton}
            onPress={() => router.push("/merchant-dashboard")}
          >
            <Text style={styles.helpButtonText}>Try dashboard demo →</Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {},
  content: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  intro: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  badge: {
    backgroundColor: palette.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: palette.primary,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 28,
    textAlign: "center",
    color: palette.foreground,
    letterSpacing: -0.025,
  },
  titleAccent: {
    fontFamily: fonts.displaySemiBold,
    fontStyle: "italic",
    color: palette.primary,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: "center",
    color: palette.mutedForeground,
    lineHeight: 20,
    maxWidth: 320,
  },
  feePill: {
    backgroundColor: palette.surface,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  feePillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  plansList: {
    gap: spacing.lg,
  },
  plansListDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  planCard: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["3xl"],
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  planCardPopular: {
    borderColor: palette.primary,
    ...shadows.lift,
  },
  planCardDesktop: {
    width: "31%",
    minWidth: 260,
  },
  popularBadge: {
    position: "absolute",
    top: -11,
    alignSelf: "center",
    backgroundColor: palette.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    ...shadows.card,
  },
  popularBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: palette.primaryForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
    marginTop: spacing.sm,
  },
  planPeriod: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  price: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 36,
    color: palette.foreground,
    letterSpacing: -0.025,
  },
  priceUnit: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  features: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(76,175,80,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  check: {
    fontSize: 10,
    color: palette.success,
    fontWeight: "700",
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
  },
  subscribeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    borderRadius: radii.xl,
    paddingVertical: 12,
    marginTop: spacing.md,
  },
  subscribeButtonPrimary: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    ...shadows.card,
  },
  subscribeButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  subscribeButtonTextPrimary: {
    color: palette.primaryForeground,
  },
  helpCard: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["3xl"],
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  helpTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  helpText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
  helpButton: {
    backgroundColor: palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.xl,
    marginTop: spacing.md,
  },
  helpButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primaryForeground,
  },
});
