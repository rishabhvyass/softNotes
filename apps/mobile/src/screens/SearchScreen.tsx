import {IconChevronLeft} from '@tabler/icons-react-native';
import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {NoteRow} from '../components/NoteRow';
import {PressableScale} from '../components/PressableScale';
import {SearchField} from '../components/SearchField';
import {EmptyState} from '../components/States';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';
import type {Note} from '../types/note';

export function SearchScreen({
  insets,
  onBack,
  onOpenNote,
}: {
  insets: EdgeInsets;
  onBack(): void;
  onOpenNote(note: Note): void;
}) {
  const theme = useAppTheme();
  const {selectNotes} = useNotes();
  const [query, setQuery] = useState('');
  const results = query.trim() ? selectNotes('active', query) : [];

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.top, {paddingTop: insets.top + 10}]}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.back, {backgroundColor: theme.colors.surface}]}>
          <IconChevronLeft size={23} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
        <View style={styles.search}>
          <SearchField value={query} onChangeText={setQuery} autoFocus />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 28}]}>
        {!query.trim() ? (
          <View style={styles.intro}>
            <Text style={[styles.introTitle, {color: theme.colors.text}]}>Find any thought</Text>
            <Text style={[styles.introBody, {color: theme.colors.textMuted}]}>Search titles, note content, or tags.</Text>
          </View>
        ) : results.length === 0 ? (
          <EmptyState title="No matches" message="Try a different word or tag." />
        ) : (
          <>
            <Text style={[styles.count, {color: theme.colors.textMuted}]}>{results.length} {results.length === 1 ? 'result' : 'results'}</Text>
            <View style={styles.list}>
              {results.map((note, index) => (
                <NoteRow key={note.id} note={note} index={index} onPress={() => onOpenNote(note)} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  top: {paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10},
  back: {width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  search: {flex: 1},
  content: {paddingHorizontal: 20, paddingTop: 22},
  intro: {paddingTop: 50, alignItems: 'center'},
  introTitle: {fontSize: 23, fontWeight: '700'},
  introBody: {fontSize: 14, marginTop: 8},
  count: {fontSize: 13, fontWeight: '600', marginBottom: 10},
  list: {gap: 8},
});

