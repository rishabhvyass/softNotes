import {useColorScheme} from 'react-native';
import {useNotes} from '../store/NotesProvider';

export type AppTheme = {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    textFaint: string;
    border: string;
    button: string;
    buttonText: string;
    dock: string;
    danger: string;
    success: string;
    shadow: string;
  };
};

const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#F3F3F4',
    surface: '#FFFFFF',
    surfaceRaised: '#FAFAFB',
    surfaceMuted: '#E9E9EC',
    text: '#18181D',
    textMuted: '#85858D',
    textFaint: '#B6B6BC',
    border: '#E4E4E7',
    button: '#19191F',
    buttonText: '#FAFAFA',
    dock: 'rgba(235,235,239,0.96)',
    danger: '#D95D68',
    success: '#4F8A6C',
    shadow: '#6E6E78',
  },
};

const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#121216',
    surface: '#1D1D22',
    surfaceRaised: '#25252B',
    surfaceMuted: '#2D2D34',
    text: '#F4F3F5',
    textMuted: '#A0A0A8',
    textFaint: '#696972',
    border: '#34343B',
    button: '#F0EFF2',
    buttonText: '#1B1B20',
    dock: 'rgba(37,37,43,0.97)',
    danger: '#F07A84',
    success: '#7BB894',
    shadow: '#000000',
  },
};

export const accents = ['#72B8FF', '#FF8FB4', '#9C82FF', '#FFB079', '#70C7A0', '#F4CC65'];

export function useAppTheme(): AppTheme {
  const system = useColorScheme();
  const {settings} = useNotes();
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && system === 'dark');
  return isDark ? darkTheme : lightTheme;
}

