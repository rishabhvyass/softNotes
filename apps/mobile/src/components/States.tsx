import {IconNotes} from '@tabler/icons-react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeIn, cancelAnimation, useReducedMotion, withRepeat, withTiming, useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import {useAppTheme} from '../theme/theme';

export function EmptyState({title, message}: {title: string; message: string}) {
  const theme = useAppTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
      <View style={[styles.emptyIcon, {backgroundColor: theme.colors.surfaceMuted}]}>
        <IconNotes size={28} color={theme.colors.textMuted} strokeWidth={1.6} />
      </View>
      <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>{title}</Text>
      <Text style={[styles.emptyMessage, {color: theme.colors.textMuted}]}>{message}</Text>
    </Animated.View>
  );
}

function SkeletonBar({width}: {width: `${number}%`}) {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.42);
  const reduceMotion = useReducedMotion();
  React.useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.8, {duration: 750}), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({opacity: opacity.value}));
  return <Animated.View style={[styles.bar, {width, backgroundColor: theme.colors.surfaceMuted}, style]} />;
}

export function LoadingRows() {
  const theme = useAppTheme();
  return (
    <View style={styles.loadingList}>
      {[0, 1, 2].map(index => (
        <View key={index} style={[styles.loadingRow, {backgroundColor: theme.colors.surface}]}>
          <View style={[styles.loadingIcon, {backgroundColor: theme.colors.surfaceMuted}]} />
          <View style={styles.loadingCopy}>
            <SkeletonBar width={index === 1 ? '62%' : '78%'} />
            <SkeletonBar width="35%" />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {alignItems: 'center', paddingVertical: 58, paddingHorizontal: 28},
  emptyIcon: {width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  emptyTitle: {fontSize: 18, fontWeight: '700', marginTop: 18},
  emptyMessage: {fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, maxWidth: 260},
  loadingList: {gap: 8},
  loadingRow: {height: 66, borderRadius: 18, flexDirection: 'row', alignItems: 'center', padding: 11, gap: 12},
  loadingIcon: {width: 42, height: 42, borderRadius: 13},
  loadingCopy: {flex: 1, gap: 8},
  bar: {height: 9, borderRadius: 5},
});
