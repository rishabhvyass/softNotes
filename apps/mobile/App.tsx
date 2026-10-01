import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, {FadeIn, FadeInDown, FadeOutDown, FadeInLeft, FadeInRight, FadeOut, useReducedMotion} from 'react-native-reanimated';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {FloatingDock} from './src/components/FloatingDock';
import {CollectionScreen} from './src/screens/CollectionScreen';
import {BackupScreen} from './src/screens/BackupScreen';
import {ComposeScreen} from './src/screens/ComposeScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {NoteDetailScreen} from './src/screens/NoteDetailScreen';
import {SearchScreen} from './src/screens/SearchScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {SplashOverlay} from './src/components/SplashOverlay';
import {NotesProvider, useNotes} from './src/store/NotesProvider';
import {useAppTheme} from './src/theme/theme';
import type {Note} from './src/types/note';

type Route =
  | {name: 'home'}
  | {name: 'saved'}
  | {name: 'all'}
  | {name: 'search'}
  | {name: 'compose'}
  | {name: 'settings'}
  | {name: 'archive'}
  | {name: 'trash'}
  | {name: 'backup'}
  | {name: 'detail'; noteId: string};

function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <NotesProvider>
          <AppNavigator />
        </NotesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const {hydrated} = useNotes();
  const [stack, setStack] = useState<Route[]>([{name: 'home'}]);
  const route = stack[stack.length - 1] ?? {name: 'home'};

  // Direction of the latest navigation, read by the incoming screen's `entering`.
  const transition = useRef<'push' | 'pop' | 'swap'>('swap');

  const navigate = useCallback((next: Route) => {
    transition.current = 'push';
    setStack(current => [...current, next]);
  }, []);
  const replaceRoot = useCallback((next: Route) => {
    transition.current = 'swap';
    setStack([next]);
  }, []);
  const goBack = useCallback(() => {
    transition.current = 'pop';
    setStack(current => (current.length > 1 ? current.slice(0, -1) : [{name: 'home'}]));
  }, []);
  const openNote = useCallback((note: Note) => navigate({name: 'detail', noteId: note.id}), [navigate]);
  const entering =
    transition.current === 'push'
      ? FadeInRight.duration(260)
      : transition.current === 'pop'
        ? FadeInLeft.duration(260)
        : FadeIn.duration(220);
  const routeKey = route.name === 'detail' ? `${route.name}-${route.noteId}` : route.name;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'detail' || stack.length === 1) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack, route.name, stack.length]);

  return (
    <View style={[styles.flex, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <Animated.View
        key={routeKey}
        entering={reduceMotion ? undefined : entering}
        exiting={reduceMotion ? undefined : FadeOut.duration(120)}
        style={styles.flex}>
        {route.name === 'home' && (
          <HomeScreen
            insets={insets}
            onOpenNote={openNote}
            onSearch={() => navigate({name: 'search'})}
            onSeeAll={() => navigate({name: 'all'})}
          />
        )}
        {route.name === 'saved' && (
          <CollectionScreen
            scope="saved"
            insets={insets}
            onOpenNote={openNote}
            onSettings={() => navigate({name: 'settings'})}
          />
        )}
        {route.name === 'all' && (
          <CollectionScreen scope="active" insets={insets} onBack={goBack} onOpenNote={openNote} />
        )}
        {route.name === 'archive' && (
          <CollectionScreen scope="archived" insets={insets} onBack={goBack} onOpenNote={openNote} />
        )}
        {route.name === 'trash' && (
          <CollectionScreen scope="trashed" insets={insets} onBack={goBack} onOpenNote={openNote} />
        )}
        {route.name === 'search' && (
          <SearchScreen insets={insets} onBack={goBack} onOpenNote={openNote} />
        )}
        {route.name === 'compose' && (
          <ComposeScreen
            insets={insets}
            onClose={goBack}
            onComplete={() => replaceRoot({name: 'home'})}
          />
        )}
        {route.name === 'detail' && (
          <NoteDetailScreen noteId={route.noteId} insets={insets} onBack={goBack} />
        )}
        {route.name === 'settings' && (
          <SettingsScreen
            insets={insets}
            onBack={goBack}
            onArchive={() => navigate({name: 'archive'})}
            onTrash={() => navigate({name: 'trash'})}
            onBackup={() => navigate({name: 'backup'})}
          />
        )}
        {route.name === 'backup' && <BackupScreen insets={insets} onBack={goBack} />}
      </Animated.View>
      {(route.name === 'home' || route.name === 'saved') && (
        <Animated.View
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          entering={reduceMotion ? undefined : FadeInDown.duration(220)}
          exiting={reduceMotion ? undefined : FadeOutDown.duration(140)}>
          <FloatingDock
            active={route.name}
            bottom={insets.bottom}
            onTab={tab => replaceRoot({name: tab})}
            onCreate={() => navigate({name: 'compose'})}
          />
        </Animated.View>
      )}
      <SplashOverlay ready={hydrated} />
    </View>
  );
}

const styles = StyleSheet.create({flex: {flex: 1}});

export default App;
