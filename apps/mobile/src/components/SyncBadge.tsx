import {
  IconCloudCheck,
  IconCloudExclamation,
  IconCloudOff,
  IconRefresh,
} from '@tabler/icons-react-native';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../theme/theme';
import type {SyncStatus} from '../types/note';

export function SyncBadge({status}: {status: SyncStatus}) {
  const theme = useAppTheme();
  const Icon = status === 'synced'
    ? IconCloudCheck
    : status === 'offline'
      ? IconCloudOff
      : status === 'error'
        ? IconCloudExclamation
        : IconRefresh;
  const label = status === 'syncing'
    ? 'Syncing'
    : status === 'synced'
      ? 'Synced'
      : status === 'offline'
        ? 'Offline'
        : status === 'error'
          ? 'Sync issue'
          : 'Local';

  return (
    <View style={styles.container} accessibilityLabel={`Sync status: ${label}`}>
      <Icon size={14} color={theme.colors.textMuted} stroke={1.8} />
      <Text style={[styles.label, {color: theme.colors.textMuted}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flexDirection: 'row', alignItems: 'center', gap: 5},
  label: {fontSize: 12, fontWeight: '500'},
});

