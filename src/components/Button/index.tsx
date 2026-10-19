import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentProps, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, PressableProps, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import useStyles, { SHIMMER_WIDTH } from "./styles";
import { theme } from "@/src/constants/theme";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  text: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  variant?: "primary" | "success" | "secondary";
  size?: "large" | "small";
  progress?: number;
  isLoading?: boolean;
}

const CONTENT_COLOR = {
  primary: theme.onPrimaryColor,
  success: theme.fontColor,
  secondary: theme.fontColor,
};

export default function Button({
  text,
  icon,
  variant = "primary",
  size = "large",
  progress,
  isLoading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const isSmall = size === "small";
  const isDisabled = !!disabled || isLoading;
  const hasProgress = progress != null;

  const scale = useSharedValue(1);
  const fill = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // A barra avança suavemente em vez de pular a cada atualização.
  useEffect(() => {
    fill.set(withTiming((progress ?? 0) * width, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [fill, progress, width]);

  // Brilho que atravessa o botão em loop enquanto baixa.
  useEffect(() => {
    if (!hasProgress) return;

    shimmer.set(0);
    shimmer.set(withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1));

    return () => cancelAnimation(shimmer);
  }, [shimmer, hasProgress]);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: fill.get() }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.get(), [0, 1], [-SHIMMER_WIDTH, width]) }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hasProgress ? Math.sin(shimmer.get() * Math.PI * 2) * 2.5 : 0 }],
  }));

  const renderContent = (color: string) => (
    <>
      {isLoading ? (
        <ActivityIndicator color={color} />
      ) : (
        icon && (
          <Animated.View style={iconStyle}>
            <Ionicons
              name={icon}
              size={isSmall ? 18 : 22}
              color={color}
            />
          </Animated.View>
        )
      )}
      <Text
        style={[styles.text, isSmall && styles.smallText, { color }]}
        numberOfLines={1}>
        {text}
      </Text>
    </>
  );

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text}
        accessibilityState={{ disabled: isDisabled, busy: isLoading || hasProgress }}
        {...props}
        disabled={isDisabled}
        onPressIn={(event) => {
          scale.set(withSpring(0.96, { damping: 15, stiffness: 300 }));
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, { damping: 12, stiffness: 250 }));
          props.onPressOut?.(event);
        }}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
          props.onLayout?.(event);
        }}
        style={(state) => [
          styles.container,
          hasProgress ? styles.progressTrack : styles[variant],
          isSmall && styles.small,
          disabled && !hasProgress && styles.disabled,
          typeof style === "function" ? style(state) : style,
        ]}>
        {/* Com progresso, o texto aparece em duas camadas: claro sobre o trilho
            escuro e escuro sobre a parte preenchida, sempre com bom contraste. */}
        {renderContent(hasProgress ? theme.primaryColor : CONTENT_COLOR[variant])}
        {hasProgress && (
          <>
            <Animated.View style={[styles.progressFill, fillStyle]}>
              <View style={[styles.progressContent, { width }]}>
                {renderContent(theme.onPrimaryColor)}
              </View>
            </Animated.View>
            <Animated.View
              style={[styles.shimmer, shimmerStyle]}
              pointerEvents="none">
              <LinearGradient
                colors={["transparent", "rgba(255, 255, 255, 0.28)", "transparent"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
