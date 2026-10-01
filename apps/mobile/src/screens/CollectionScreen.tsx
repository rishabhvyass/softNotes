import {IconChevronLeft, IconSettings} from '@tabler/icons-react-native';
import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {NoteActionsSheet} from '../components/NoteActionsSheet';
import {NoteRow} from '../components/NoteRow';
import {PressableScale} from '../components/PressableScale';
import {SearchField} from '../components/SearchField';
import {EmptyState, LoadingRows} from '../components/States';
import {useHaptics} from '../hooks/useHaptics';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';
import type {CollectionScope, Note} from '../types/note';

const copy: Record<CollectionScope, {title: string; emptyTitle: string; emptyMessage: string}> = {
  active: {title: 'All notes', emptyTitle: 'No notes yet', emptyMessage: 'Create your first note and it will appear here.'},
  saved: {title: 'Saved', emptyTitle: 'Nothing saved', emptyMessage: 'Save the notes you want close at hand.'},
  archived: {title: 'Archive', emptyTitle: 'Archive is empty', emptyMessage: 'Notes you archive will stay safely out of the way.'},
  trashed: {title: 'Trash', emptyTitle: 'Trash is empty', emptyMessage: 'Deleted notes remain here until you remove them forever.'},
};

export function CollectionScreen({
  scope,
  insets,
  onBack,
  onOpenNote,
  onSettings,
}: {
  scope: CollectionScope;
  insets: EdgeInsets;
  onBack?(): void;
  onOpenNote(note: Note): void;
  onSettings?(): void;
}) {
  const theme = useAppTheme();
  const haptic = useHaptics();
  const notesStore = useNotes();
  const [query, setQuery] = useState('');
  const [actionNote, setActionNote] = useState<Note | null>(null);
  const notes = notesStore.selectNotes(scope, query);
  const screenCopy = copy[scope];

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {paddingTop: insets.top + 12, paddingBottom: insets.bottom + (scope === 'saved' ? 130 : 34)},
        ]}>
        <View style={styles.header}>
          {onBack ? (
            <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
              <IconChevronLeft size={23} color={theme.colors.text} strokeWidth={1.8} />
            </PressableScale>
          ) : <View style={styles.circleSpacer} />}
          <Text style={[styles.title, {color: theme.colors.text}]}>{screenCopy.title}</Text>
          {onSettings ? (
            <PressableScale accessibilityRole="button" accessibilityLabel="Open settings" onPress={onSettings} style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
              <IconSettings size={21} color={theme.colors.text} strokeWidth={1.7} />
            </PressableScale>
          ) : <View style={styles.circleSpacer} />}
        </View>

        <View style={styles.searchWrap}>
          <SearchField value={query} onChangeText={setQuery} />
        </View>

        {!notesStore.hydrated ? (
          <LoadingRows />
        ) : notes.length === 0 ? (
          <EmptyState
            title={query ? 'No matches' : screenCopy.emptyTitle}
            message={query ? 'Try a different word or tag.' : screenCopy.emptyMessage}
          />
        ) : (
          <View style={styles.list}>
            {notes.map((note, index) => (
              <NoteRow
                key={note.id}
                note={note}
                index={index}
                onPress={() => onOpenNote(note)}
                onLongPress={() => {
                  haptic('impactMedium');
                  setActionNote(note);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <NoteActionsSheet
        note={actionNote}
        visible={Boolean(actionNote)}
        onClose={() => setActionNote(null)}
        onFavorite={() => actionNote && notesStore.toggleFavorite(actionNote.id)}
        onArchive={() => actionNote && notesStore.archiveNote(actionNote.id)}
        onTrash={() => actionNote && notesStore.trashNote(actionNote.id)}
        onRestore={() => actionNote && notesStore.restoreNote(actionNote.id)}
        onDeleteForever={() => actionNote && notesStore.deleteForever(actionNote.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {paddingHorizontal: 20},
  header: {height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  circle: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  circleSpacer: {width: 42},
  title: {fontSize: 22, fontWeight: '700', letterSpacing: -0.4},
  searchWrap: {marginTop: 18, marginBottom: 14},
  list: {gap: 8},
});
