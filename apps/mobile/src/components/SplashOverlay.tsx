import React, {useEffect, useState} from 'react';
import {Image, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useAppTheme} from '../theme/theme';

const LOGO_SIZE = 120;
const MIN_VISIBLE_MS = 700;
const EXIT_MS = 420;

/**
 * Continues the native launch screen (same logo, same size, same position) and
 * dissolves it once local notes have loaded, so there is no jump between the
 * native splash and the first React frame.
 */
export function SplashOverlay({ready}: {ready: boolean}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);
  const fade = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), reduceMotion ? 0 : MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    fade.value = withTiming(0, {duration: reduceMotion ? 120 : EXIT_MS, easing: Easing.out(Easing.cubic)});
    if (!reduceMotion) {
      scale.value = withSequence(
        withTiming(0.94, {duration: 140, easing: Easing.out(Easing.quad)}),
        withTiming(1.45, {duration: EXIT_MS - 140, easing: Easing.in(Easing.cubic)}),
      );
    }
    const timer = setTimeout(() => setGone(true), (reduceMotion ? 120 : EXIT_MS) + 40);
    return () => clearTimeout(timer);
  }, [ready, minElapsed, reduceMotion, fade, scale]);

  const overlayStyle = useAnimatedStyle(() => ({opacity: fade.value}));
  const logoStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  if (gone) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.overlay, {backgroundColor: theme.colors.background}, overlayStyle]}>
      <Animated.View style={logoStyle}>
        <Image source={require('../assets/splash-logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {alignItems: 'center', justifyContent: 'center', zIndex: 100},
  logo: {width: LOGO_SIZE, height: LOGO_SIZE},
});
