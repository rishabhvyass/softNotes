import {IconSearch, IconX} from '@tabler/icons-react-native';
import React from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {useAppTheme} from '../theme/theme';
import {PressableScale} from './PressableScale';

export function SearchField({
  value,
  onChangeText,
  autoFocus = false,
}: {
  value: string;
  onChangeText(value: string): void;
  autoFocus?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.field, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
      <IconSearch size={20} color={theme.colors.textMuted} strokeWidth={1.8} />
      <TextInput
        autoFocus={autoFocus}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search notes"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor="#8A70ED"
        returnKeyType="search"
        style={[styles.input, {color: theme.colors.text}]}
        accessibilityLabel="Search notes"
      />
      {value.length > 0 && (
        <PressableScale accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')}>
          <IconX size={18} color={theme.colors.textMuted} strokeWidth={1.8} />
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {flex: 1, fontSize: 16, paddingVertical: 0},
});

