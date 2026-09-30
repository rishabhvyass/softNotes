import {
  IconArchive,
  IconChevronLeft,
  IconCloudCheck,
  IconDeviceMobile,
  IconMoon,
  IconRefresh,
  IconServer,
  IconSun,
  IconTrash,
  IconDeviceMobileVibration,
} from '@tabler/icons-react-native';
import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import {PressableScale} from '../components/PressableScale';
import {SyncBadge} from '../components/SyncBadge';
import {useHaptics} from '../hooks/useHaptics';
import {useNotes} from '../store/NotesProvider';
import {useAppTheme} from '../theme/theme';
import type {ThemePreference} from '../types/note';

export function SettingsScreen({
  insets,
  onBack,
  onArchive,
  onTrash,
}: {
  insets: EdgeInsets;
  onBack(): void;
  onArchive(): void;
  onTrash(): void;
}) {
  const theme = useAppTheme();
  const haptic = useHaptics();
  const store = useNotes();
  const [apiUrl, setApiUrl] = useState(store.settings.apiUrl);

  const applyApiUrl = () => {
    const normalized = apiUrl.trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(normalized)) {
      Alert.alert('Invalid server URL', 'Use a complete http:// or https:// address.');
      return;
    }
    store.updateSettings({apiUrl: normalized});
    haptic('notificationSuccess');
    setTimeout(() => store.syncNow(), 50);
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, {paddingTop: insets.top + 10}]}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.circle, {backgroundColor: theme.colors.surface}]}>
          <IconChevronLeft size={23} color={theme.colors.text} stroke={1.8} />
        </PressableScale>
        <Text style={[styles.title, {color: theme.colors.text}]}>Settings</Text>
        <View style={styles.circle} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 36}]}>
        <View style={[styles.syncCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <View style={[styles.syncIcon, {backgroundColor: theme.colors.surfaceMuted}]}>
            <IconCloudCheck size={25} color={theme.colors.text} stroke={1.6} />
          </View>
          <View style={styles.syncCopy}>
            <Text style={[styles.cardTitle, {color: theme.colors.text}]}>Your private sync</Text>
            <SyncBadge status={store.syncStatus} />
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Sync now"
            onPress={() => {
              haptic('impactLight');
              store.syncNow();
            }}
            style={[styles.refresh, {backgroundColor: theme.colors.surfaceMuted}]}>
            <IconRefresh size={19} color={theme.colors.text} stroke={1.8} />
          </PressableScale>
        </View>
        {store.error && (
          <Text style={[styles.error, {color: theme.colors.danger}]}>{store.error} Your notes are still saved on this device.</Text>
        )}

        <SectionTitle label="Appearance" />
        <View style={[styles.section, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <View style={styles.themeRow}>
            <IconSun size={20} color={theme.colors.textMuted} />
            <View style={styles.themeOptions}>
              {(['system', 'light', 'dark'] as ThemePreference[]).map(preference => {
                const Icon = preference === 'system' ? IconDeviceMobile : preference === 'light' ? IconSun : IconMoon;
                const selected = store.settings.theme === preference;
                return (
                  <PressableScale
                    key={preference}
                    accessibilityRole="radio"
                    accessibilityState={{selected}}
                    onPress={() => store.updateSettings({theme: preference})}
                    style={[
                      styles.themeOption,
                      {backgroundColor: selected ? theme.colors.button : theme.colors.surfaceMuted},
                    ]}>
                    <Icon size={17} color={selected ? theme.colors.buttonText : theme.colors.textMuted} stroke={1.8} />
                    <Text style={[styles.themeLabel, {color: selected ? theme.colors.buttonText : theme.colors.textMuted}]}>
                      {preference[0].toUpperCase() + preference.slice(1)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>
          <View style={[styles.divider, {backgroundColor: theme.colors.border}]} />
          <View style={styles.settingRow}>
            <View style={styles.settingLabelWrap}>
              <IconDeviceMobileVibration size={21} color={theme.colors.text} stroke={1.7} />
              <View>
                <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Haptic feedback</Text>
                <Text style={[styles.settingHelper, {color: theme.colors.textMuted}]}>Small tactile cues for actions</Text>
              </View>
            </View>
            <Switch
              value={store.settings.hapticsEnabled}
              onValueChange={value => store.updateSettings({hapticsEnabled: value})}
              trackColor={{false: theme.colors.surfaceMuted, true: '#A891F3'}}
              thumbColor={theme.colors.surface}
            />
          </View>
        </View>

        <SectionTitle label="Server" />
        <View style={[styles.section, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <View style={styles.serverLabel}>
            <IconServer size={21} color={theme.colors.text} stroke={1.7} />
            <Text style={[styles.settingLabel, {color: theme.colors.text}]}>Bun API address</Text>
          </View>
          <TextInput
            value={apiUrl}
            onChangeText={setApiUrl}
            onSubmitEditing={applyApiUrl}
            onBlur={applyApiUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectionColor="#8A70ED"
            style={[styles.urlInput, {backgroundColor: theme.colors.surfaceMuted, color: theme.colors.text}]}
          />
          <Text style={[styles.serverHint, {color: theme.colors.textMuted}]}>Use your Mac’s LAN address when testing on a physical phone.</Text>
        </View>

        <SectionTitle label="Library" />
        <View style={styles.libraryGrid}>
          <LibraryButton label="Archive" icon={IconArchive} count={store.selectNotes('archived').length} onPress={onArchive} />
          <LibraryButton label="Trash" icon={IconTrash} count={store.selectNotes('trashed').length} onPress={onTrash} />
        </View>

        <PressableScale
          onPress={() => Alert.alert(
            'Reset local sample data?',
            'This replaces notes on this device with the three starter notes. Server data is not deleted.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Reset', style: 'destructive', onPress: () => store.resetLocalData()},
            ],
          )}
          style={[styles.reset, {borderColor: theme.colors.border}]}>
          <Text style={[styles.resetLabel, {color: theme.colors.danger}]}>Reset local sample data</Text>
        </PressableScale>

        <Text style={[styles.footer, {color: theme.colors.textFaint}]}>Soft Notes stores every edit locally first. Sync is optional and uses your own Bun server.</Text>
      </ScrollView>
    </View>
  );
}

function SectionTitle({label}: {label: string}) {
  const theme = useAppTheme();
  return <Text style={[styles.sectionTitle, {color: theme.colors.textMuted}]}>{label}</Text>;
}

function LibraryButton({
  label,
  icon: Icon,
  count,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{size?: number; color?: string; stroke?: number}>;
  count: number;
  onPress(): void;
}) {
  const theme = useAppTheme();
  return (
    <PressableScale onPress={onPress} style={[styles.libraryButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
      <Icon size={23} color={theme.colors.text} stroke={1.7} />
      <Text style={[styles.libraryLabel, {color: theme.colors.text}]}>{label}</Text>
      <Text style={[styles.libraryCount, {color: theme.colors.textMuted}]}>{count}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  header: {height: 104, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  circle: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 21, fontWeight: '700'},
  content: {paddingHorizontal: 20, paddingTop: 14},
  syncCard: {minHeight: 82, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center'},
  syncIcon: {width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  syncCopy: {flex: 1, marginLeft: 12, gap: 5},
  cardTitle: {fontSize: 16, fontWeight: '700'},
  refresh: {width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  error: {fontSize: 12, lineHeight: 18, marginTop: 10, paddingHorizontal: 4},
  sectionTitle: {fontSize: 12, fontWeight: '700', marginTop: 26, marginBottom: 9, paddingHorizontal: 3},
  section: {borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 15},
  themeRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  themeOptions: {flex: 1, flexDirection: 'row', gap: 6},
  themeOption: {flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2},
  themeLabel: {fontSize: 9, fontWeight: '700'},
  divider: {height: StyleSheet.hairlineWidth, marginVertical: 14},
  settingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  settingLabelWrap: {flexDirection: 'row', alignItems: 'center', gap: 11},
  settingLabel: {fontSize: 14, fontWeight: '600'},
  settingHelper: {fontSize: 11, marginTop: 3},
  serverLabel: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12},
  urlInput: {height: 48, borderRadius: 14, paddingHorizontal: 13, fontSize: 13},
  serverHint: {fontSize: 11, lineHeight: 16, marginTop: 9},
  libraryGrid: {flexDirection: 'row', gap: 10},
  libraryButton: {flex: 1, height: 104, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 14, justifyContent: 'space-between'},
  libraryLabel: {fontSize: 14, fontWeight: '700'},
  libraryCount: {position: 'absolute', top: 14, right: 14, fontSize: 15, fontWeight: '700'},
  reset: {height: 52, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 28},
  resetLabel: {fontSize: 14, fontWeight: '600'},
  footer: {fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 24, marginTop: 18},
});
