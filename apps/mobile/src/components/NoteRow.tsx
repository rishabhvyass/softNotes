import {IconChevronRight, IconHeartFilled} from '@tabler/icons-react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInDown, LinearTransition, useReducedMotion} from 'react-native-reanimated';
import {useAppTheme} from '../theme/theme';
import type {Note} from '../types/note';
import {relativeDate} from '../utils/date';
import {NoteGlyph} from './NoteGlyph';
import {PressableScale} from './PressableScale';

export function NoteRow({
  note,
  index = 0,
  onPress,
  onLongPress,
  trailing,
}: {
  note: Note;
  index?: number;
  onPress(): void;
  onLongPress?(): void;
  trailing?: React.ReactNode;
}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.delay(Math.min(index, 6) * 45).duration(340)}
      layout={reduceMotion ? undefined : LinearTransition.springify().damping(18)}>
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={320}
        accessibilityRole="button"
        accessibilityLabel={`${note.title}, ${relativeDate(note.updatedAt)}`}
        style={[styles.row, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
        <NoteGlyph icon={note.icon} accent={note.accent} size={42} />
        <View style={styles.copy}>
          <View style={styles.titleLine}>
            <Text style={[styles.title, {color: theme.colors.text}]} numberOfLines={1}>
              {note.title}
            </Text>
            {note.isFavorite && <IconHeartFilled size={14} color={note.accent} />}
          </View>
          <Text style={[styles.meta, {color: theme.colors.textMuted}]}>{relativeDate(note.updatedAt)}</Text>
        </View>
        {trailing ?? <IconChevronRight size={18} color={theme.colors.textFaint} stroke={1.6} />}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 12,
  },
  copy: {flex: 1, minWidth: 0},
  titleLine: {flexDirection: 'row', alignItems: 'center', gap: 6},
  title: {fontSize: 15, fontWeight: '600', flexShrink: 1},
  meta: {fontSize: 12, marginTop: 3},
});

