import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  IconBook2,
  IconBriefcase2,
  IconBulb,
  IconChecklist,
  IconHeart,
  IconHeartbeat,
  IconHome,
  IconLeaf,
  IconMusic,
  IconPlane,
  IconSparkles,
  IconStar,
} from '@tabler/icons-react-native';
import type {NoteIcon} from '../types/note';

type GlyphIcon = React.ComponentType<{size?: number; color?: string; stroke?: number}>;

const glyphs: Record<NoteIcon, GlyphIcon> = {
  spark: IconSparkles,
  idea: IconBulb,
  heart: IconHeart,
  book: IconBook2,
  briefcase: IconBriefcase2,
  leaf: IconLeaf,
  music: IconMusic,
  travel: IconPlane,
  home: IconHome,
  health: IconHeartbeat,
  check: IconChecklist,
  star: IconStar,
};

export function NoteGlyph({
  icon,
  accent,
  size = 42,
  selected = false,
}: {
  icon: NoteIcon;
  accent: string;
  size?: number;
  selected?: boolean;
}) {
  const Icon = glyphs[icon];
  const iconSize = Math.max(14, size * 0.46);
  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size * 0.31,
          backgroundColor: accent,
          shadowColor: accent,
        },
        selected ? styles.selected : styles.unselected,
      ]}>
      <View style={[styles.highlight, {borderRadius: size * 0.28}]} />
      <Icon size={iconSize} color="#FFFFFF" stroke={1.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 5,
    overflow: 'hidden',
  },
  highlight: {
    ...StyleSheet.absoluteFill,
    top: 1,
    bottom: '48%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  selected: {borderWidth: 3, borderColor: '#FFFFFF'},
  unselected: {borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)'},
});
