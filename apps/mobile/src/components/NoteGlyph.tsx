import React, {useId} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
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

type GlyphIcon = React.ComponentType<{size?: number; color?: string; strokeWidth?: number}>;

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
  const gradientId = `glyph-${useId().replace(/:/g, '')}`;
  return (
    <View style={{width: size, height: size}}>
      <View style={[styles.backLayer, {
        width: size * 0.88, height: size * 0.88, borderRadius: size * 0.29,
        backgroundColor: accent, shadowColor: accent,
      }]} />
      <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size * 0.31,
          shadowColor: accent,
        },
        selected ? styles.selected : styles.unselected,
      ]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.96} />
            <Stop offset="0.38" stopColor={accent} stopOpacity={0.62} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.94} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={size * 0.3} fill={`url(#${gradientId})`} />
      </Svg>
      <Icon size={iconSize} color="#FFFFFF" strokeWidth={1.8} />
      </View>
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
  backLayer: {position: 'absolute', left: -3, top: -5, transform: [{rotate: '-13deg'}], shadowOpacity: 0.23, shadowRadius: 8, shadowOffset: {width: 0, height: 5}, elevation: 3},
  selected: {borderWidth: 3, borderColor: '#FFFFFF'},
  unselected: {borderWidth: 1, borderColor: 'rgba(255,255,255,0.62)'},
});
