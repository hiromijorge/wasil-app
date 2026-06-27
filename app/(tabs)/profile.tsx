import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  User,
  Mail,
  Phone,
  ClipboardList,
  Store,
  LogOut,
  ChevronRight,
  Camera,
  Crown,
  Calendar,
  MapPin,
  Shield,
  FileText,
  Copy,
  Check,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../src/lib/auth-context";
import { useTranslation } from "../../src/lib/i18n";
import { palette, fonts, spacing, radii } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { LangSwitcher } from "../../src/components/LangSwitcher";
import { Toast } from "../../src/components/Toast";
import { supabase } from "../../src/lib/supabase";

const MD_BREAKPOINT = 768;

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMemberSince(date: string | null | undefined, locale: string) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString(locale === "ar" ? "ar-YE" : "en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const { t, lang } = useTranslation();
  const { user, profile, role, signOut, updateProfile, demo } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [toastVisible, setToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayRole = profile?.role ?? role ?? "customer";
  const isMerchant = displayRole === "merchant";

  const avatarUrl = profile?.avatar_url;
  const initials = useMemo(() => getInitials(profile?.full_name), [profile?.full_name]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setSaving(false);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
      return;
    }
    setIsEditing(false);
  }, [fullName, phone, email, updateProfile, t]);

  const handleCancel = useCallback(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setEmail(profile?.email ?? "");
    setIsEditing(false);
  }, [profile]);

  const handlePickAvatar = useCallback(async () => {
    if (demo || !user?.id) {
      Alert.alert(t("demoRestriction"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const file = result.assets[0];
      const ext = file.uri.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: file.mimeType ?? "image/jpeg",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await updateProfile({ avatar_url: data.publicUrl });
      if (updateError) throw updateError;
    } catch (err) {
      Alert.alert(t("tryAgain"), err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingAvatar(false);
    }
  }, [demo, user?.id, updateProfile, t]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/auth");
  }, [signOut, router]);

  const handleCopyReferral = useCallback(async () => {
    const code = profile?.referral_code;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setToastVisible(true);
    setTimeout(() => setCopied(false), 2000);
  }, [profile?.referral_code]);

  const menuItems = [
    {
      icon: MapPin,
      label: t("myAddresses"),
      onPress: () => router.push("/addresses"),
    },
    {
      icon: ClipboardList,
      label: t("myActivity"),
      onPress: () => router.push("/(tabs)/orders"),
    },
    ...(isMerchant
      ? [
          {
            icon: Store,
            label: t("merchantDashboard"),
            onPress: () => router.push("/merchant-dashboard"),
          },
        ]
      : []),
    {
      icon: Shield,
      label: t("privacyPolicy"),
      onPress: () => router.push("/privacy-policy"),
    },
    {
      icon: FileText,
      label: t("termsOfService"),
      onPress: () => router.push("/terms-of-service"),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={[palette.primary, `${palette.primary}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        >
          <View style={styles.headerPattern} />
          <View style={styles.headerContent}>
            <Pressable
              onPress={handlePickAvatar}
              style={styles.avatarWrapper}
              accessibilityRole="button"
              accessibilityLabel={t("changeAvatar")}
            >
              <View style={[styles.avatarRing, uploadingAvatar && styles.avatarRingUploading]}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: `${palette.primaryForeground}20` }]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={palette.primaryForeground} />
                ) : (
                  <Camera size={12} color={palette.primaryForeground} />
                )}
              </View>
            </Pressable>

            <Text style={styles.name}>{profile?.full_name ?? t("guest")}</Text>
            <View style={styles.roleBadge}>
              <Crown size={10} color={palette.primary} />
              <Text style={styles.roleText}>{t(`role_${displayRole}`)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View style={styles.body}>
          {/* Membership card */}
          <Card padding="lg" style={styles.membershipCard}>
            <View style={styles.membershipRow}>
              <View style={styles.membershipItem}>
                <Calendar size={18} color={palette.primary} />
                <Text style={styles.membershipLabel}>{t("memberSince")}</Text>
                <Text style={styles.membershipValue}>
                  {formatMemberSince(profile?.created_at, lang)}
                </Text>
              </View>
              <View style={styles.membershipDivider} />
              <View style={[styles.membershipItem, styles.referralItem]}>
                <Text style={styles.membershipLabel}>{t("referralCode")}</Text>
                <View style={styles.referralCodeRow}>
                  <Text style={styles.referralCode} numberOfLines={1}>
                    {profile?.referral_code ?? "—"}
                  </Text>
                  {profile?.referral_code && (
                    <Pressable
                      onPress={handleCopyReferral}
                      style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                      accessibilityRole="button"
                      accessibilityLabel={t("copyCode")}
                      hitSlop={8}
                    >
                      {copied ? (
                        <Check size={14} color={palette.success} />
                      ) : (
                        <Copy size={14} color={palette.primary} />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </Card>

          {/* Contact section */}
          <Card padding="lg" style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("contactInfo")}</Text>
              {!isEditing ? (
                <Pressable
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.editButtonText}>{t("edit")}</Text>
                </Pressable>
              ) : null}
            </View>

            {isEditing ? (
              <View style={styles.form}>
                <Input
                  label={t("fullName")}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t("fullNamePlaceholder")}
                  autoCapitalize="words"
                />
                <Input
                  label={t("phone")}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t("phonePlaceholder")}
                  keyboardType="phone-pad"
                />
                <Input
                  label={t("email")}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.formActions}>
                  <Button
                    title={t("save")}
                    onPress={handleSave}
                    loading={saving}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t("cancel")}
                    variant="outline"
                    onPress={handleCancel}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.readOnlyList}>
                <View style={styles.readOnlyRow}>
                  <View style={styles.readOnlyIcon}>
                    <User size={16} color={palette.primary} />
                  </View>
                  <View style={styles.readOnlyText}>
                    <Text style={styles.readOnlyLabel}>{t("fullName")}</Text>
                    <Text style={styles.readOnlyValue}>{profile?.full_name ?? "—"}</Text>
                  </View>
                </View>
                <View style={styles.readOnlyRow}>
                  <View style={styles.readOnlyIcon}>
                    <Phone size={16} color={palette.primary} />
                  </View>
                  <View style={styles.readOnlyText}>
                    <Text style={styles.readOnlyLabel}>{t("phone")}</Text>
                    <Text style={styles.readOnlyValue}>{profile?.phone ?? user?.phone ?? "—"}</Text>
                  </View>
                </View>
                <View style={styles.readOnlyRow}>
                  <View style={styles.readOnlyIcon}>
                    <Mail size={16} color={palette.primary} />
                  </View>
                  <View style={styles.readOnlyText}>
                    <Text style={styles.readOnlyLabel}>{t("email")}</Text>
                    <Text style={styles.readOnlyValue}>{profile?.email ?? user?.email ?? "—"}</Text>
                  </View>
                </View>
              </View>
            )}
          </Card>

          {/* Menu */}
          <Card padding="lg" style={styles.card}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={[
                  styles.menuRow,
                  index !== menuItems.length - 1 && styles.menuRowBorder,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.menuIcon}>
                  <item.icon size={18} color={palette.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={16} color={palette.mutedForeground} />
              </Pressable>
            ))}
            <View style={[styles.menuRow, styles.menuRowBorder]}>
              <View style={styles.menuIcon}>
                <Text style={styles.langMenuIcon}>ع</Text>
              </View>
              <Text style={styles.menuLabel}>{t("language")}</Text>
              <LangSwitcher compact />
            </View>
            <Pressable
              onPress={handleSignOut}
              style={styles.menuRow}
              accessibilityRole="button"
            >
              <View style={[styles.menuIcon, { backgroundColor: `${palette.destructive}15` }]}>
                <LogOut size={18} color={palette.destructive} />
              </View>
              <Text style={[styles.menuLabel, { color: palette.destructive }]}>{t("signOut")}</Text>
              <ChevronRight size={16} color={palette.mutedForeground} />
            </Pressable>
          </Card>

          {demo && (
            <View style={styles.demoNotice}>
              <Text style={styles.demoNoticeText}>{t("demoModeNotice")}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Toast
        message={t("copied")}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii["3xl"],
    borderBottomRightRadius: radii["3xl"],
    overflow: "hidden",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
    backgroundColor: "transparent",
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarRing: {
    padding: 4,
    borderRadius: radii.full,
    backgroundColor: `${palette.primaryForeground}30`,
  },
  avatarRingUploading: {
    opacity: 0.7,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    objectFit: "cover",
  },
  avatarInitials: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: palette.primaryForeground,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.primaryForeground,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.primaryForeground,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: `${palette.primaryForeground}20`,
  },
  roleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primaryForeground,
    textTransform: "capitalize",
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginTop: -spacing.xl,
  },
  membershipCard: {
    marginBottom: spacing.lg,
    // Container styling is handled by Card.
  },
  membershipRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  membershipItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  membershipDivider: {
    width: 1,
    height: 40,
    backgroundColor: palette.border,
  },
  membershipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  membershipValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  referralItem: {
    alignItems: "flex-start",
    paddingLeft: spacing.md,
  },
  referralCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  referralCode: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.primary,
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonSuccess: {
    backgroundColor: `${palette.success}12`,
  },
  card: {
    marginBottom: spacing.lg,
    // Container styling is handled by Card.
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
  },
  editButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  form: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  readOnlyList: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  readOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  readOnlyText: {
    flex: 1,
    gap: 2,
  },
  readOnlyLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  readOnlyValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  langMenuIcon: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primary,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  demoNotice: {
    backgroundColor: `${palette.warning}20`,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoNoticeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.foreground,
    textAlign: "center",
  },
});
