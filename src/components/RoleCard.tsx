import { Pressable, Text, View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { palette, fonts, radii, shadows } from "../lib/theme";

interface RoleCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  onPress: () => void;
}

export function RoleCard({
  title,
  description,
  Icon,
  color,
  onPress,
}: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.98, { stiffness: 400, damping: 20 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[styles.card, shadows.card, animatedStyle]}>
        <View style={[styles.iconRing, { backgroundColor: `${color}15` }]}>
          <Icon size={22} color={color} strokeWidth={2} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <ChevronRight size={18} color={palette.mutedForeground} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    marginHorizontal: 14,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: palette.foreground,
    marginBottom: 2,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
});
