import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  useColorScheme,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShoppingCart, User, LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";
import { useCart } from "../lib/cart-context";
import { useAuth } from "../lib/auth-context";
import { useTranslation } from "../lib/i18n";
import { LangSwitcher } from "./LangSwitcher";

const MD_BREAKPOINT = 768;

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showCart?: boolean;
  transparent?: boolean;
  right?: React.ReactNode;
}

export function TopBar({
  title,
  showBack = false,
  onBack,
  showCart = false,
  transparent = false,
  right,
}: TopBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const { width } = useWindowDimensions();
  const { itemCount, openCart } = useCart();
  const { t } = useTranslation();

  const cartCount = itemCount ?? 0;
  const { user, signOut } = useAuth();
  const isDesktop = width >= MD_BREAKPOINT;

  const handleAuth = async () => {
    if (user) {
      await signOut();
      router.replace("/auth");
    } else {
      router.push("/auth");
    }
  };

  return (
    <>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
      />
      <View
        style={[
          styles.container,
          transparent && styles.transparent,
          { paddingTop: insets.top + (isDesktop ? spacing.md : spacing.sm) },
        ]}
      >
        <View style={styles.inner}>
          {/* Left: page title (with optional back) or brand logo */}
          <View style={styles.left}>
            {(title || showBack) && !isDesktop ? (
              <View style={styles.titleRow}>
                {showBack && (
                  <Pressable
                    style={[styles.iconButton, styles.backButton]}
                    onPress={onBack ? onBack : () => router.back()}
                    hitSlop={8}
                    accessibilityLabel={t("goBack")}
                  >
                    <ArrowLeft size={20} color={palette.foreground} />
                  </Pressable>
                )}
                {title ? (
                  <Text style={styles.pageTitle} numberOfLines={1}>
                    {title}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Pressable
                style={styles.logoWrapper}
                onPress={() => router.push("/(tabs)/")}
              >
                <LinearGradient
                  colors={[palette.primary, `${palette.primary}B3`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logo}
                >
                  <Text style={styles.logoText}>W</Text>
                </LinearGradient>
                <Text style={styles.brand}>Wasil</Text>
              </Pressable>
            )}
          </View>

          {/* Desktop nav */}
          {isDesktop ? (
            <View style={styles.desktopNav}>
              <Pressable onPress={() => router.push("/(tabs)/stores")}>
                <Text style={styles.navLink}>{t("storesTitle")}</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/(tabs)/orders")}>
                <Text style={styles.navLink}>{t("myOrders")}</Text>
              </Pressable>
              <LangSwitcher />
              {showCart && (
                <Pressable style={styles.desktopCart} onPress={openCart}>
                  <ShoppingCart size={16} color={palette.foreground} />
                  <Text style={styles.desktopCartText}>{t("cart")}</Text>
                  {cartCount > 0 && (
                    <View style={styles.desktopBadge}>
                      <Text style={styles.desktopBadgeText}>
                        {cartCount > 9 ? "9+" : String(cartCount)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
              <Pressable
                style={user ? styles.signOutButton : styles.signInButton}
                onPress={handleAuth}
              >
                {user ? (
                  <LogOut size={14} color={palette.destructive} />
                ) : (
                  <User size={14} color={palette.primary} />
                )}
                <Text
                  style={[
                    styles.signInButtonText,
                    user && { color: palette.destructive },
                  ]}
                >
                  {user ? t("signOut") : t("signIn")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.merchantButton}
                onPress={() => router.push("/merchant-dashboard")}
              >
                <Text style={styles.merchantButtonText}>{t("forMerchants")} →</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Right: mobile cart / custom */}
          {!isDesktop ? (
            <View style={styles.right}>
              <Pressable
                style={user ? styles.signOutButtonMobile : styles.signInButtonMobile}
                onPress={handleAuth}
                hitSlop={8}
              >
                {user ? (
                  <LogOut size={16} color={palette.destructive} />
                ) : (
                  <User size={16} color={palette.primary} />
                )}
              </Pressable>
              {showCart && (
                <Pressable
                  style={styles.cartButton}
                  onPress={() => openCart?.()}
                  hitSlop={8}
                >
                  <ShoppingCart size={18} color={palette.foreground} />
                  {cartCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {cartCount > 9 ? "9+" : String(cartCount)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
              {right}
            </View>
          ) : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${palette.background}D9`,
    borderBottomWidth: 1,
    borderBottomColor: `${palette.border}B3`,
    paddingBottom: spacing.sm,
  },
  transparent: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    maxWidth: 1152,
    alignSelf: "center",
    width: "100%",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
    flexShrink: 1,
  },
  backButton: {
    marginRight: spacing.xs,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radii["2xl"],
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  logoText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.primaryForeground,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
    lineHeight: 18,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  navLink: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: palette.mutedForeground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  langButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xs,
  },
  langText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: palette.foreground,
  },
  desktopCart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    position: "relative",
  },
  desktopCartText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  desktopBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: palette.background,
  },
  desktopBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: palette.primaryForeground,
  },
  merchantButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    marginLeft: spacing.sm,
  },
  merchantButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primaryForeground,
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  signInButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  signOutButtonMobile: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonMobile: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: palette.background,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: palette.primaryForeground,
  },
});
