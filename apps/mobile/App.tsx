import React, {useCallback, useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, {FadeInRight, FadeOutLeft, useReducedMotion} from 'react-native-reanimated';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {CollectionScreen} from './src/screens/CollectionScreen';
import {ComposeScreen} from './src/screens/ComposeScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {NoteDetailScreen} from './src/screens/NoteDetailScreen';
import {SearchScreen} from './src/screens/SearchScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {NotesProvider} from './src/store/NotesProvider';
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
  const [stack, setStack] = useState<Route[]>([{name: 'home'}]);
  const route = stack[stack.length - 1] ?? {name: 'home'};

  const navigate = useCallback((next: Route) => {
    setStack(current => [...current, next]);
  }, []);
  const replaceRoot = useCallback((next: Route) => setStack([next]), []);
  const goBack = useCallback(() => {
    setStack(current => (current.length > 1 ? current.slice(0, -1) : [{name: 'home'}]));
  }, []);
  const openNote = useCallback((note: Note) => navigate({name: 'detail', noteId: note.id}), [navigate]);
  const routeKey = route.name === 'detail' ? `${route.name}-${route.noteId}` : route.name;

  return (
    <View style={[styles.flex, {backgroundColor: theme.colors.background}]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <Animated.View
        key={routeKey}
        entering={reduceMotion ? undefined : FadeInRight.duration(280)}
        exiting={reduceMotion ? undefined : FadeOutLeft.duration(180)}
        style={styles.flex}>
        {route.name === 'home' && (
          <HomeScreen
            insets={insets}
            onTab={tab => replaceRoot({name: tab})}
            onCreate={() => navigate({name: 'compose'})}
            onOpenNote={openNote}
            onSearch={() => navigate({name: 'search'})}
            onSeeAll={() => navigate({name: 'all'})}
          />
        )}
        {route.name === 'saved' && (
          <CollectionScreen
            scope="saved"
            insets={insets}
            showDock
            onTab={tab => replaceRoot({name: tab})}
            onCreate={() => navigate({name: 'compose'})}
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
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({flex: {flex: 1}});

export default App;
