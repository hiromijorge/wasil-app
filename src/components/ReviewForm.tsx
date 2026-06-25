import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Star } from "lucide-react-native";
import { useTranslation } from "../lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";
import { Button } from "./Button";
import { Input } from "./Input";

interface ReviewFormProps {
  initialRating?: number;
  initialComment?: string;
  onSubmit: (rating: number, comment: string) => void;
  loading?: boolean;
}

export function ReviewForm({ initialRating = 0, initialComment = "", onSubmit, loading }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  return (
    <View style={[styles.card, shadows.card]}>
      <Text style={styles.title}>{t("rateYourOrder")}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            accessibilityRole="button"
            accessibilityLabel={`${star} stars`}
          >
            <Star
              size={32}
              color={star <= rating ? palette.warning : palette.border}
              fill={star <= rating ? palette.warning : "transparent"}
            />
          </Pressable>
        ))}
      </View>
      <Input
        label={t("reviewCommentLabel")}
        value={comment}
        onChangeText={setComment}
        placeholder={t("reviewCommentPlaceholder")}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.textArea}
      />
      <Button
        title={t("submitReview")}
        onPress={() => onSubmit(rating, comment)}
        loading={loading}
        disabled={rating === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  stars: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 80,
  },
});
