import React from 'react';
import {Pressable, type PressableProps, StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function PressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={[animatedStyle, disabled && styles.disabled]}>
      <Pressable
        {...props}
        disabled={disabled}
        style={style}
        onPressIn={event => {
          scale.value = reduceMotion ? 1 : withTiming(0.965, {duration: 90});
          onPressIn?.(event);
        }}
        onPressOut={event => {
          scale.value = reduceMotion ? 1 : withSpring(1, {damping: 18, stiffness: 240});
          onPressOut?.(event);
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  disabled: {opacity: 0.45},
});

