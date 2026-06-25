import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { Input } from "./Input";
import { LocationButton, type GeoLocation } from "./LocationButton";
import { supabase } from "../lib/supabase";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";

interface Suggestion {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  address: string;
  location: GeoLocation | null;
  onChange: (address: string, location: GeoLocation | null) => void;
}

export function AddressAutocomplete({
  label,
  placeholder,
  address,
  location,
  onChange,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(address);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const ignoreBlurRef = useRef(false);

  useEffect(() => {
    setInputValue(address);
  }, [address]);

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([]);
      return;
    }
    if (location && inputValue === location.address) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          suggestions: Suggestion[];
        }>("search-location", { body: { query: inputValue } });
        if (!error && data?.suggestions) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        }
      } catch {
        // silently fail; user can still type manually
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inputValue, location]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    if (text !== address) {
      onChange(text, null);
    }
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: Suggestion) => {
    setInputValue(suggestion.address);
    onChange(suggestion.address, {
      address: suggestion.address,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleLocate = (loc: GeoLocation) => {
    setInputValue(loc.address);
    onChange(loc.address, loc);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <View style={styles.wrapper}>
      <Input
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChangeText={handleTextChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          if (ignoreBlurRef.current) {
            ignoreBlurRef.current = false;
            return;
          }
          // Small delay so a suggestion tap can fire first
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        rightElement={
          <LocationButton onLocate={handleLocate} variant="compact" />
        }
      />

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <View style={[styles.dropdown, shadows.card]}>
          {loading && suggestions.length === 0 && (
            <ActivityIndicator
              color={palette.primary}
              style={{ marginVertical: spacing.md }}
            />
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((s, index) => (
              <Pressable
                key={`${s.lat}-${s.lng}-${index}`}
                style={[
                  styles.suggestion,
                  index !== suggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPressIn={() => {
                  ignoreBlurRef.current = true;
                }}
                onPress={() => handleSelect(s)}
                accessibilityRole="button"
              >
                <MapPin
                  size={14}
                  color={palette.primary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {s.address}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    maxHeight: 220,
    marginTop: -spacing.xs,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.foreground,
    lineHeight: 18,
  },
});
