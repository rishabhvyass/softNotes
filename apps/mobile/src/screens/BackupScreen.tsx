import {IconChevronLeft} from '@tabler/icons-react-native';
import React, {useState} from 'react';
import {Alert, ScrollView, Share, StyleSheet, Text, TextInput, View} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {PressableScale} from '../components/PressableScale';
import {exportBackup, importBackup} from '../services/backup';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';

export function BackupScreen({insets, onBack}: {insets: EdgeInsets; onBack(): void}) {
  const theme = useAppTheme();
  const store = useNotes();
  const [json, setJson] = useState('');
  const [message, setMessage] = useState('');
  const share = async () => {
    try { await Share.share({title: 'SoftNotes backup', message: exportBackup(store.notes)}); }
    catch { Alert.alert('Could not share backup', 'Please try again.'); }
  };
  const restore = () => {
    try {
      const notes = importBackup(json);
      Alert.alert('Merge this backup?', `${notes.length} notes will be merged. Newer notes already on this device are kept. Pending permanent deletions are respected.`, [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Import', onPress: () => {
          store.importNotes(notes);
          setJson('');
          setMessage('Backup imported. Your existing notes were kept.');
        }},
      ]);
    } catch (error) {
      Alert.alert('Could not import backup', error instanceof Error ? error.message : 'Invalid backup.');
    }
  };
  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
          <IconChevronLeft size={23} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
        <Text style={[styles.title, {color: theme.colors.text}]}>Backup & restore</Text>
        <View style={styles.circle} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}>
        <View style={[styles.card, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.title, {color: theme.colors.text}]}>Keep a copy of your thoughts</Text>
          <Text style={[styles.helper, {color: theme.colors.textMuted}]}>
            Export all {store.notes.length} notes, including archive and trash, as JSON text. Use the share sheet to copy it or send it to your own storage. Server settings and unfinished drafts are not included.
          </Text>
          <PressableScale accessibilityRole="button" onPress={share} style={[styles.button, {backgroundColor: theme.colors.button}]}>
            <Text style={[styles.buttonText, {color: theme.colors.buttonText}]}>Share JSON backup</Text>
          </PressableScale>
        </View>
        <View style={[styles.card, {backgroundColor: theme.colors.surface}]}>
          <Text style={[styles.title, {color: theme.colors.text}]}>Restore a backup</Text>
          <Text style={[styles.helper, {color: theme.colors.textMuted}]}>Paste a SoftNotes JSON backup below. Import merges by note ID and never clears your library.</Text>
          <TextInput accessibilityLabel="Backup JSON" multiline value={json} onChangeText={setJson}
            placeholder={'{"format": "softnotes", …}'} placeholderTextColor={theme.colors.textFaint}
            autoCorrect={false} autoCapitalize="none" textAlignVertical="top"
            style={[styles.input, {backgroundColor: theme.colors.surfaceMuted, color: theme.colors.text}]} />
          <PressableScale accessibilityRole="button" disabled={!json.trim()} onPress={restore} style={[styles.button, {backgroundColor: theme.colors.button}]}>
            <Text style={[styles.buttonText, {color: theme.colors.buttonText}]}>Validate & import</Text>
          </PressableScale>
          {Boolean(message) && <Text style={[styles.helper, {color: theme.colors.success}]}>{message}</Text>}
        </View>
        <Text style={[styles.helper, {color: theme.colors.textMuted}]}>Backups are plain text, not encrypted. Store them somewhere private.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  header: {paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  circle: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 19, fontWeight: '700'},
  content: {padding: 20, gap: 16},
  card: {padding: 20, borderRadius: 24},
  helper: {fontSize: 13, lineHeight: 20, marginTop: 9},
  button: {height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  buttonText: {fontSize: 14, fontWeight: '700'},
  input: {minHeight: 160, maxHeight: 230, padding: 14, borderRadius: 16, fontSize: 12, marginTop: 18},
});
