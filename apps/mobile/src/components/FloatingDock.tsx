import {IconBookmark, IconHome, IconPlus} from '@tabler/icons-react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useHaptics} from '../hooks/useHaptics';
import {useAppTheme} from '../theme/theme';
import {PressableScale} from './PressableScale';

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
  const activateTab = (tab: MainTab) => {
    haptic('selection');
    onTab(tab);
  };

  return (
    <View style={[styles.wrap, {bottom: Math.max(10, bottom + 4)}]} pointerEvents="box-none">
      <View
        style={[
          styles.dock,
          {backgroundColor: theme.colors.dock, borderColor: theme.colors.border, shadowColor: theme.colors.shadow},
        ]}>
        <DockItem
          label="Home"
          active={active === 'home'}
          icon={IconHome}
          onPress={() => activateTab('home')}
        />
        <View style={styles.centerGap} />
        <DockItem
          label="Saved"
          active={active === 'saved'}
          icon={IconBookmark}
          onPress={() => activateTab('saved')}
        />
      </View>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Create a new note"
        onPress={() => {
          haptic('impactMedium');
          onCreate();
        }}
        style={[
          styles.create,
          {backgroundColor: theme.colors.button, borderColor: theme.colors.background, shadowColor: theme.colors.shadow},
        ]}>
        <IconPlus size={27} color={theme.colors.buttonText} stroke={1.7} />
      </PressableScale>
    </View>
  );
}

function DockItem({
  label,
  active,
  icon: Icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: React.ComponentType<{size?: number; color?: string; stroke?: number}>;
  onPress(): void;
}) {
  const theme = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.tab, active && {backgroundColor: theme.colors.surface}]}>
      <Icon size={20} color={active ? '#8A70ED' : theme.colors.textFaint} stroke={1.8} />
      <Text style={[styles.tabLabel, {color: active ? theme.colors.text : theme.colors.textMuted}]}>{label}</Text>
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
    padding: 6,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  centerGap: {width: 72},
  create: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    top: -13,
    borderWidth: 4,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 7},
    elevation: 12,
  },
  tab: {
    flex: 1,
    height: 52,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {fontSize: 10, fontWeight: '600'},
});

