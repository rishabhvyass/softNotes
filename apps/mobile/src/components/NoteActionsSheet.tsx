import {
  IconArchive,
  IconHeart,
  IconHeartFilled,
  IconRestore,
  IconTrash,
} from '@tabler/icons-react-native';
import React from 'react';
import {Alert, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {useReducedMotion} from 'react-native-reanimated';
import {useAppTheme} from '../theme/theme';
import type {Note} from '../types/note';
import {PressableScale} from './PressableScale';

type Action = {
  label: string;
  icon: React.ComponentType<{size?: number; color?: string; strokeWidth?: number}>;
  color?: string;
  onPress(): void;
};

export function NoteActionsSheet({
  note,
  visible,
  onClose,
  onFavorite,
  onArchive,
  onTrash,
  onRestore,
  onDeleteForever,
}: {
  note: Note | null;
  visible: boolean;
  onClose(): void;
  onFavorite(): void;
  onArchive(): void;
  onTrash(): void;
  onRestore(): void;
  onDeleteForever(): void;
}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  if (!note) return null;

  const run = (callback: () => void) => {
    onClose();
    setTimeout(callback, 120);
  };
  const actions: Action[] = note.deletedAt
    ? [
        {label: 'Restore note', icon: IconRestore, onPress: () => run(onRestore)},
        {label: 'Delete forever', icon: IconTrash, color: theme.colors.danger, onPress: () => run(() => Alert.alert('Delete forever?', 'This cannot be undone.', [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Delete', style: 'destructive', onPress: onDeleteForever},
        ]))},
      ]
    : [
        {
          label: note.isFavorite ? 'Remove from saved' : 'Save note',
          icon: note.isFavorite ? IconHeartFilled : IconHeart,
          onPress: () => run(onFavorite),
        },
        {label: note.isArchived ? 'Unarchive' : 'Archive', icon: IconArchive, onPress: () => run(note.isArchived ? onRestore : onArchive)},
        {label: 'Move to trash', icon: IconTrash, color: theme.colors.danger, onPress: () => run(onTrash)},
      ];

  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close note actions" />
        <View style={[styles.sheet, {backgroundColor: theme.colors.surfaceRaised}]}>
          <View style={[styles.handle, {backgroundColor: theme.colors.border}]} />
          <Text style={[styles.noteTitle, {color: theme.colors.text}]} numberOfLines={1}>{note.title}</Text>
          <View style={styles.actions}>
            {actions.map(({label, icon: Icon, color, onPress}) => (
              <PressableScale
                key={label}
                onPress={onPress}
                accessibilityRole="button"
                style={[styles.action, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
                <Icon size={21} color={color ?? theme.colors.text} strokeWidth={1.7} />
                <Text style={[styles.actionLabel, {color: color ?? theme.colors.text}]}>{label}</Text>
              </PressableScale>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9,9,12,0.28)'},
  sheet: {borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingBottom: 34},
  handle: {width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18},
  noteTitle: {fontSize: 18, fontWeight: '700', marginBottom: 14, paddingHorizontal: 3},
  actions: {gap: 8},
  action: {
    height: 56,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionLabel: {fontSize: 15, fontWeight: '600'},
});
