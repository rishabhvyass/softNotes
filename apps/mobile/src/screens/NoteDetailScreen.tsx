import {
  IconArchive,
  IconChevronLeft,
  IconHeart,
  IconHeartFilled,
  IconRestore,
  IconTrash,
} from '@tabler/icons-react-native';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {NoteGlyph} from '../components/NoteGlyph';
import {PressableScale} from '../components/PressableScale';
import {useHaptics} from '../hooks/useHaptics';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';
import {relativeDate} from '../utils/date';
import {normalizeTags, validateContent} from '../utils/noteValidation';

export function NoteDetailScreen({
  noteId,
  insets,
  onBack,
}: {
  noteId: string;
  insets: EdgeInsets;
  onBack(): void;
}) {
  const theme = useAppTheme();
  const haptic = useHaptics();
  const store = useNotes();
  const note = store.notes.find(candidate => candidate.id === noteId);
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '');
  const [message, setMessage] = useState<string | null>(null);

  const dirty = Boolean(note && (title !== note.title || body !== note.body || tags !== note.tags.join(', ')));
  const leave = () => {
    if (!dirty || note?.deletedAt) { onBack(); return; }
    Alert.alert('Keep your changes?', 'Save this note before leaving, or discard the unsaved edits.', [
      {text: 'Keep editing', style: 'cancel'},
      {text: 'Discard', style: 'destructive', onPress: onBack},
      {text: 'Save & leave', onPress: () => { if (save()) onBack(); }},
    ]);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    return () => subscription.remove();
  });

  if (!note) {
    return (
      <View style={[styles.missing, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.missingTitle, {color: theme.colors.text}]}>This note is no longer here.</Text>
        <PressableScale onPress={onBack} style={[styles.doneButton, {backgroundColor: theme.colors.button}]}>
          <Text style={[styles.doneLabel, {color: theme.colors.buttonText}]}>Go back</Text>
        </PressableScale>
      </View>
    );
  }

  const save = () => {
    const contentError = validateContent(title, body, normalizeTags(tags));
    if (contentError) {
      setMessage(contentError);
      haptic('notificationWarning');
      return false;
    }
    store.updateNote(note.id, {
      title: title.trim(),
      body,
      tags: normalizeTags(tags),
    });
    setMessage('Changes saved');
    haptic('notificationSuccess');
    setTimeout(() => setMessage(null), 1600);
    return true;
  };

  const confirmTrash = () => {
    Alert.alert('Move this note to trash?', 'You can restore it later from Settings.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Move to trash', style: 'destructive', onPress: () => { store.trashNote(note.id); onBack(); }},
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={leave} style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
          <IconChevronLeft size={23} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>Note</Text>
          <Text style={[styles.headerMeta, {color: theme.colors.textMuted}]}>Updated {relativeDate(note.updatedAt)}</Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={note.isFavorite ? 'Remove from saved' : 'Save note'}
          onPress={() => store.toggleFavorite(note.id)}
          style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
          {note.isFavorite
            ? <IconHeartFilled size={22} color={note.accent} />
            : <IconHeart size={22} color={theme.colors.text} strokeWidth={1.8} />}
        </PressableScale>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 30}]}>
        <View style={[styles.paper, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow}]}>
          <View style={styles.noteMeta}>
            <NoteGlyph icon={note.icon} accent={note.accent} size={49} />
            <View>
              <Text style={[styles.createdLabel, {color: theme.colors.text}]}>Personal note</Text>
              <Text style={[styles.createdDate, {color: theme.colors.textMuted}]}>
                {new Intl.DateTimeFormat(undefined, {dateStyle: 'medium'}).format(new Date(note.createdAt))}
              </Text>
            </View>
          </View>
          <TextInput
            editable={!note.deletedAt}
            value={title}
            onChangeText={setTitle}
            selectionColor={note.accent}
            style={[styles.titleInput, {color: theme.colors.text}]}
            maxLength={160}
          />
          <TextInput
            editable={!note.deletedAt}
            value={body}
            onChangeText={setBody}
            maxLength={50_000}
            selectionColor={note.accent}
            multiline
            textAlignVertical="top"
            placeholder="No additional details"
            placeholderTextColor={theme.colors.textFaint}
            style={[styles.bodyInput, {color: theme.colors.text, borderColor: theme.colors.border}]}
          />
          <TextInput
            editable={!note.deletedAt}
            value={tags}
            onChangeText={setTags}
            maxLength={1000}
            selectionColor={note.accent}
            placeholder="#tags"
            placeholderTextColor={theme.colors.textFaint}
            autoCapitalize="none"
            style={[styles.tagsInput, {color: theme.colors.textMuted}]}
          />
        </View>

        {message && <Text style={[styles.message, {color: message === 'Changes saved' ? theme.colors.success : theme.colors.danger}]}>{message}</Text>}

        {note.deletedAt ? (
          <View style={styles.singleAction}>
            <ActionButton label="Restore" icon={IconRestore} onPress={() => { store.restoreNote(note.id); onBack(); }} />
            <ActionButton
              label="Delete forever"
              icon={IconTrash}
              danger
              onPress={() => Alert.alert('Delete forever?', 'This cannot be undone.', [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Delete', style: 'destructive', onPress: () => { store.deleteForever(note.id); onBack(); }},
              ])}
            />
          </View>
        ) : (
          <>
            <PressableScale onPress={save} style={[styles.doneButton, {backgroundColor: theme.colors.button}]}>
              <Text style={[styles.doneLabel, {color: theme.colors.buttonText}]}>Save changes</Text>
            </PressableScale>
            <View style={styles.secondaryActions}>
              <ActionButton label={note.isArchived ? 'Unarchive' : 'Archive'} icon={IconArchive} onPress={() => { if (note.isArchived) store.restoreNote(note.id); else store.archiveNote(note.id); onBack(); }} />
              <ActionButton label="Trash" icon={IconTrash} danger onPress={confirmTrash} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onPress,
  danger = false,
}: {
  label: string;
  icon: React.ComponentType<{size?: number; color?: string; strokeWidth?: number}>;
  onPress(): void;
  danger?: boolean;
}) {
  const theme = useAppTheme();
  const color = danger ? theme.colors.danger : theme.colors.text;
  return (
    <PressableScale onPress={onPress} wrapperStyle={styles.flexItem} style={[styles.actionButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
      <Icon size={20} color={color} strokeWidth={1.7} />
      <Text style={[styles.actionLabel, {color}]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  header: {paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  flexItem: {flexGrow: 1},
  circle: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  headerCopy: {alignItems: 'center'},
  headerTitle: {fontSize: 17, fontWeight: '700'},
  headerMeta: {fontSize: 11, marginTop: 3},
  content: {paddingHorizontal: 20, paddingTop: 14},
  paper: {minHeight: 400, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, padding: 20, shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: {width: 0, height: 12}, elevation: 7},
  noteMeta: {flexDirection: 'row', alignItems: 'center', gap: 12},
  createdLabel: {fontSize: 14, fontWeight: '700'},
  createdDate: {fontSize: 11, marginTop: 3},
  titleInput: {fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 24, paddingVertical: 4},
  bodyInput: {minHeight: 185, fontSize: 16, lineHeight: 24, paddingTop: 18, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth},
  tagsInput: {fontSize: 13, paddingVertical: 8, marginTop: 5},
  message: {fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 12},
  doneButton: {height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  doneLabel: {fontSize: 15, fontWeight: '700'},
  secondaryActions: {flexDirection: 'row', gap: 10, marginTop: 10},
  singleAction: {gap: 10, marginTop: 18},
  actionButton: {height: 54, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  actionLabel: {fontSize: 14, fontWeight: '600'},
  missing: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  missingTitle: {fontSize: 18, fontWeight: '700'},
});
