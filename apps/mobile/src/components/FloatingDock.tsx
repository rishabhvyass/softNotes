import {IconPlus} from '@tabler/icons-react-native';
import React, {useEffect, useState} from 'react';
import {StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type {SharedValue} from 'react-native-reanimated';
import {useHaptics} from '../hooks/useHaptics';
import {useAppTheme} from '../theme/theme';
import {PressableScale} from './PressableScale';
import {NoteGlyph} from './NoteGlyph';

const DOCK_PADDING = 6;
const CENTER_GAP = 72;

export type MainTab = 'home' | 'saved';

export function FloatingDock({
  active,
  bottom,
  onTab,
  onCreate,
}: {
  active: MainTab;
  bottom: number;
  onTab(tab: MainTab): void;
  onCreate(): void;
}) {
  const theme = useAppTheme();
  const haptic = useHaptics();
  const reduceMotion = useReducedMotion();
  const [dockWidth, setDockWidth] = useState(0);
  // 0 = Home, 1 = Saved. A single shared value drives the pill, labels and icons.
  const progress = useSharedValue(active === 'saved' ? 1 : 0);
  const tabWidth = Math.max(0, (dockWidth - DOCK_PADDING * 2 - CENTER_GAP) / 2);

  useEffect(() => {
    const target = active === 'saved' ? 1 : 0;
    progress.value = reduceMotion ? target : withSpring(target, {damping: 20, stiffness: 220, mass: 0.9});
  }, [active, progress, reduceMotion]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{translateX: progress.value * (tabWidth + CENTER_GAP)}],
  }));
  const activateTab = (tab: MainTab) => {
    if (tab === active) return;
    haptic('selection');
    onTab(tab);
  };
  const onDockLayout = (event: LayoutChangeEvent) => setDockWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.wrap, {bottom: Math.max(10, bottom + 4)}]} pointerEvents="box-none">
      <View
        onLayout={onDockLayout}
        style={[
          styles.dock,
          {backgroundColor: theme.colors.dock, borderColor: theme.colors.border, shadowColor: theme.colors.shadow},
        ]}>
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, {width: tabWidth, backgroundColor: theme.colors.surface}, pillStyle]}
          />
        )}
        <DockItem
          label="Home"
          index={0}
          progress={progress}
          active={active === 'home'}
          onPress={() => activateTab('home')}
        />
        <View style={styles.centerGap} />
        <DockItem
          label="Saved"
          index={1}
          progress={progress}
          active={active === 'saved'}
          onPress={() => activateTab('saved')}
        />
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Create a new note"
        wrapperStyle={styles.createPosition}
        onPress={() => {
          haptic('impactMedium');
          onCreate();
        }}
        style={[
          styles.create,
          {backgroundColor: theme.colors.button, borderColor: theme.colors.background, shadowColor: theme.colors.shadow},
        ]}>
        <IconPlus size={27} color={theme.colors.buttonText} strokeWidth={1.7} />
      </PressableScale>
    </View>
  );
}

function DockItem({
  label,
  index,
  progress,
  active,
  onPress,
}: {
  label: string;
  index: 0 | 1;
  progress: SharedValue<number>;
  active: boolean;
  onPress(): void;
}) {
  const theme = useAppTheme();
  const labelStyle = useAnimatedStyle(() => {
    const activeness = index === 0 ? 1 - progress.value : progress.value;
    return {color: interpolateColor(activeness, [0, 1], [theme.colors.textMuted, theme.colors.text])};
  });
  const iconStyle = useAnimatedStyle(() => {
    const activeness = index === 0 ? 1 - progress.value : progress.value;
    return {transform: [{scale: 1 + 0.1 * Math.max(0, Math.min(1, activeness))}]};
  });
  return (
    <PressableScale
      accessibilityRole="tab"
      wrapperStyle={styles.tabPosition}
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={styles.tab}>
      <Animated.View style={iconStyle}>
        <NoteGlyph icon={label === 'Home' ? 'home' : 'heart'} accent={active ? (label === 'Home' ? '#ADA9BD' : '#FF8FB4') : '#C8C7CF'} size={23} />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, labelStyle]}>{label}</Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: 20, right: 20, height: 75, zIndex: 20},
  dock: {
    height: 64,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    padding: DOCK_PADDING,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  centerGap: {width: CENTER_GAP},
  pill: {position: 'absolute', left: DOCK_PADDING, top: DOCK_PADDING, height: 52, borderRadius: 24},
  tabPosition: {flex: 1},
  createPosition: {position: 'absolute', alignSelf: 'center', top: -13},
  create: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 7},
    elevation: 12,
  },
  tab: {
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {fontSize: 10, fontWeight: '600'},
});
