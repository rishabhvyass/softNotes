import {IconSearch} from '@tabler/icons-react-native';
import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {FloatingDock, type MainTab} from '../components/FloatingDock';
import {FolderHero} from '../components/FolderHero';
import {NoteRow} from '../components/NoteRow';
import {PressableScale} from '../components/PressableScale';
import {LoadingRows} from '../components/States';
import {SyncBadge} from '../components/SyncBadge';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';
import type {Note} from '../types/note';
import {formatHeaderDate} from '../utils/date';

export function HomeScreen({
  insets,
  onTab,
  onCreate,
  onOpenNote,
  onSearch,
  onSeeAll,
}: {
  insets: EdgeInsets;
  onTab(tab: MainTab): void;
  onCreate(): void;
  onOpenNote(note: Note): void;
  onSearch(): void;
  onSeeAll(): void;
}) {
  const theme = useAppTheme();
  const {selectNotes, hydrated, syncStatus} = useNotes();
  const notes = selectNotes('active');
  const recent = notes.slice(0, 4);

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingTop: insets.top + 14, paddingBottom: insets.bottom + 130}]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.date, {color: theme.colors.textMuted}]}>{formatHeaderDate()}</Text>
            <Text style={[styles.title, {color: theme.colors.text}]}>Notes</Text>
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Search notes"
            onPress={onSearch}
            style={[
              styles.search,
              {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow},
            ]}>
            <IconSearch size={22} color={theme.colors.text} stroke={1.8} />
          </PressableScale>
        </View>

        <FolderHero notes={notes} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleLine}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>Recent</Text>
            <SyncBadge status={syncStatus} />
          </View>
          <PressableScale accessibilityRole="button" onPress={onSeeAll} hitSlop={12}>
            <Text style={[styles.seeAll, {color: theme.colors.textMuted}]}>See all</Text>
          </PressableScale>
        </View>

        {!hydrated ? (
          <LoadingRows />
        ) : (
          <View style={styles.list}>
            {recent.map((note, index) => (
              <NoteRow key={note.id} note={note} index={index} onPress={() => onOpenNote(note)} />
            ))}
          </View>
        )}
      </ScrollView>
      <FloatingDock active="home" bottom={insets.bottom} onTab={onTab} onCreate={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {paddingHorizontal: 20},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  date: {fontSize: 13, fontWeight: '500', textTransform: 'capitalize'},
  title: {fontSize: 34, lineHeight: 39, letterSpacing: -1.1, fontWeight: '700'},
  search: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 5,
  },
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10},
  sectionTitleLine: {flexDirection: 'row', alignItems: 'center', gap: 12},
  sectionTitle: {fontSize: 17, fontWeight: '700'},
  seeAll: {fontSize: 13, fontWeight: '500'},
  list: {gap: 7},
});
