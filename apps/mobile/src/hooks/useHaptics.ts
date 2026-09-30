import {useCallback} from 'react';
import ReactNativeHapticFeedback, {HapticFeedbackTypes} from 'react-native-haptic-feedback';
import {useNotes} from '../store/NotesProvider';

export function useHaptics() {
  const {settings} = useNotes();
  return useCallback(
    (type: keyof typeof HapticFeedbackTypes = 'impactLight') => {
      if (!settings.hapticsEnabled) return;
      ReactNativeHapticFeedback.trigger(type, {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
    },
    [settings.hapticsEnabled],
  );
}
