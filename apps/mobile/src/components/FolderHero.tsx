import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useAppTheme} from '../theme/theme';
import type {Note} from '../types/note';
import {NoteGlyph} from './NoteGlyph';

const AnimatedGlyph = ({note, delay, position}: {note: Note; delay: number; position: number}) => {
  const float = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    float.value = withDelay(
      delay,
      withRepeat(withTiming(-6, {duration: 1600, easing: Easing.inOut(Easing.quad)}), -1, true),
    );
    return () => cancelAnimation(float);
  }, [delay, float, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: float.value}, {rotate: `${(position - 1) * 5}deg`}],
  }));

  return (
    <Animated.View
      style={[
        styles.floatingGlyph,
        position === 0 ? styles.glyphLeft : position === 1 ? styles.glyphCenter : styles.glyphRight,
        animatedStyle,
      ]}>
      <NoteGlyph icon={note.icon} accent={note.accent} size={48} />
    </Animated.View>
  );
};

export function FolderHero({notes}: {notes: Note[]}) {
  const theme = useAppTheme();
  const preview = notes.slice(0, 3);

  return (
    <View style={styles.hero} accessibilityLabel={`${notes.length} notes in your collection`}>
      <View style={styles.glyphGroup}>
        {preview.map((note, index) => (
          <AnimatedGlyph key={note.id} note={note} delay={index * 220} position={index} />
        ))}
      </View>
      <View
        style={[
          styles.folderBack,
          {
            backgroundColor: theme.colors.surfaceRaised,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
        ]}>
        <View style={[styles.folderTab, {backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.border}]} />
      </View>
      <View
        style={[
          styles.folderFront,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
          },
        ]}>
        <View style={[styles.countBubble, {backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.border}]}>
          <Text style={[styles.count, {color: theme.colors.text}]}>{notes.length}</Text>
        </View>
        <View style={[styles.folderPill, theme.dark ? styles.lavenderDark : styles.lavenderLight]}>
          <Text style={styles.folderLabel}>Notes</Text>
          <View style={[styles.folderSwitch, {backgroundColor: theme.colors.surface}]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {height: 230, position: 'relative', alignItems: 'center'},
  floatingGlyph: {position: 'absolute', zIndex: 3},
  glyphGroup: {width: 192, height: 82, alignSelf: 'center', zIndex: 3},
  glyphLeft: {left: 14, top: 27},
  glyphCenter: {left: 72, top: 8},
  glyphRight: {left: 130, top: 27},
  folderBack: {
    position: 'absolute',
    top: 92,
    width: 184,
    height: 116,
    borderRadius: 24,
    borderWidth: 1,
  },
  folderTab: {
    position: 'absolute',
    top: -15,
    right: 12,
    width: 82,
    height: 31,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  folderFront: {
    position: 'absolute',
    top: 103,
    width: 192,
    height: 125,
    borderRadius: 25,
    borderTopLeftRadius: 29,
    borderWidth: 1,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 12},
    elevation: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 13,
  },
  countBubble: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  count: {fontSize: 15, fontWeight: '600'},
  folderPill: {
    height: 43,
    minWidth: 106,
    borderRadius: 22,
    paddingLeft: 18,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  folderLabel: {color: '#7860D8', fontWeight: '600', fontSize: 14},
  folderSwitch: {width: 34, height: 34, borderRadius: 17},
  lavenderLight: {backgroundColor: '#E9E2FF'},
  lavenderDark: {backgroundColor: '#342C4D'},
});
