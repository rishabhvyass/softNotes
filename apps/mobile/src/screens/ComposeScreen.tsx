import {IconArrowLeft, IconArrowRight, IconCheck, IconX} from '@tabler/icons-react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {EdgeInsets} from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {NoteGlyph} from '../components/NoteGlyph';
import {PressableScale} from '../components/PressableScale';
import {useHaptics} from '../hooks/useHaptics';
import {useNotes} from '../store/NotesProvider';
import {accents, useAppTheme} from '../theme/theme';
import {NOTE_ICONS, type Note, type NoteIcon} from '../types/note';
import {notePeriodLabel} from '../utils/date';
import {normalizeTags, validateContent} from '../utils/noteValidation';

type ComposeStage = 'icon' | 'write' | 'saving';

export function ComposeScreen({
  insets,
  onClose,
  onComplete,
}: {
  insets: EdgeInsets;
  onClose(): void;
  onComplete(note: Note): void;
}) {
  const theme = useAppTheme();
  const haptic = useHaptics();
  const {createNote, composeDraft, updateComposeDraft} = useNotes();
  const [stage, setStage] = useState<ComposeStage>(composeDraft?.title || composeDraft?.body ? 'write' : 'icon');
  const [icon, setIcon] = useState<NoteIcon>(composeDraft?.icon ?? 'spark');
  const [accent, setAccent] = useState(composeDraft?.accent ?? accents[0]);
  const [title, setTitle] = useState(composeDraft?.title ?? '');
  const [body, setBody] = useState(composeDraft?.body ?? '');
  const [tags, setTags] = useState(composeDraft?.tags ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<Note | null>(null);
  const titleRef = useRef<React.ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    if (stage === 'saving') return;
    updateComposeDraft({title, body, tags, icon, accent});
  }, [title, body, tags, icon, accent, stage, updateComposeDraft]);

  const chooseIcon = (nextIcon: NoteIcon, index: number) => {
    haptic('selection');
    setIcon(nextIcon);
    setAccent(accents[index % accents.length]);
  };

  const startWriting = () => {
    haptic('impactLight');
    setStage('write');
    setTimeout(() => titleRef.current?.focus(), 430);
  };

  const save = () => {
    const contentError = validateContent(title, body, normalizeTags(tags));
    if (contentError) {
      setError(contentError);
      haptic('notificationWarning');
      titleRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    const note = createNote({
      title,
      body,
      icon,
      accent,
      tags: normalizeTags(tags),
    });
    setSavedNote(note);
    setStage('saving');
    updateComposeDraft(null);
    haptic('notificationSuccess');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {stage === 'icon' && (
        <IconPicker
          insets={insets}
          icon={icon}
          accent={accent}
          onChoose={chooseIcon}
          onClose={onClose}
          onContinue={startWriting}
        />
      )}
      {stage === 'write' && (
        <Writer
          insets={insets}
          icon={icon}
          accent={accent}
          title={title}
          body={body}
          tags={tags}
          error={error}
          titleRef={titleRef}
          onTitle={value => {
            setTitle(value);
            if (value.trim()) setError(null);
          }}
          onBody={setBody}
          onTags={setTags}
          onBack={() => setStage('icon')}
          onClose={onClose}
          onSave={save}
        />
      )}
      {stage === 'saving' && savedNote && (
        <SaveAnimation insets={insets} note={savedNote} onFinished={() => onComplete(savedNote)} />
      )}
    </KeyboardAvoidingView>
  );
}

function IconPicker({
  insets,
  icon,
  accent,
  onChoose,
  onClose,
  onContinue,
}: {
  insets: EdgeInsets;
  icon: NoteIcon;
  accent: string;
  onChoose(icon: NoteIcon, index: number): void;
  onClose(): void;
  onContinue(): void;
}) {
  const theme = useAppTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOutLeft.duration(220)}
      style={[styles.stage, {paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14}]}>
      <View style={styles.stageHeader}>
        <View style={styles.headerSlot} />
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, {color: theme.colors.textMuted}]}>New note</Text>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>Select an icon</Text>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.closeButton, {backgroundColor: theme.colors.surface}]}>
          <IconX size={19} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
      </View>

      <View style={styles.pickerContent}>
        <Text style={[styles.pickerTitle, {color: theme.colors.text}]}>Select an icon{`\n`}for your note</Text>
        <Animated.View key={`${icon}-${accent}`} entering={FadeIn.duration(180)} style={styles.preview}>
          <NoteGlyph icon={icon} accent={accent} size={76} selected />
        </Animated.View>
        <View style={styles.iconGrid}>
          {NOTE_ICONS.map((item, index) => {
            const itemAccent = accents[index % accents.length];
            const selected = item === icon;
            return (
              <PressableScale
                key={item}
                accessibilityRole="radio"
                accessibilityState={{selected}}
                accessibilityLabel={`${item} icon`}
                onPress={() => onChoose(item, index)}
                style={[
                  styles.iconChoice,
                  {backgroundColor: theme.colors.surface, borderColor: selected ? itemAccent : theme.colors.border},
                ]}>
                <NoteGlyph icon={item} accent={itemAccent} size={44} selected={selected} />
              </PressableScale>
            );
          })}
        </View>
      </View>

      <RoundAction label="Continue to write" onPress={onContinue} icon="arrow" bottom={0} />
    </Animated.View>
  );
}

function Writer({
  insets,
  icon,
  accent,
  title,
  body,
  tags,
  error,
  titleRef,
  onTitle,
  onBody,
  onTags,
  onBack,
  onClose,
  onSave,
}: {
  insets: EdgeInsets;
  icon: NoteIcon;
  accent: string;
  title: string;
  body: string;
  tags: string;
  error: string | null;
  titleRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  onTitle(value: string): void;
  onBody(value: string): void;
  onTags(value: string): void;
  onBack(): void;
  onClose(): void;
  onSave(): void;
}) {
  const theme = useAppTheme();
  const now = useMemo(() => new Date(), []);
  return (
    <Animated.View
      entering={FadeInRight.springify().damping(20).stiffness(160)}
      style={[styles.stage, {paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10}]}>
      <View style={styles.stageHeader}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Choose another icon" onPress={onBack} style={[styles.closeButton, {backgroundColor: theme.colors.surface}]}>
          <IconArrowLeft size={19} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, {color: theme.colors.textMuted}]}>New note</Text>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>Write it down</Text>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.closeButton, {backgroundColor: theme.colors.surface}]}>
          <IconX size={19} color={theme.colors.text} strokeWidth={1.8} />
        </PressableScale>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.writerContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.prompt, {color: theme.colors.text}]}>What’s on your{`\n`}mind today?</Text>
        <View style={[styles.notePaper, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow}]}>
          <View style={styles.noteMeta}>
            <NoteGlyph icon={icon} accent={accent} size={43} />
            <View>
              <Text style={[styles.periodLabel, {color: theme.colors.text}]}>{notePeriodLabel(now)}</Text>
              <Text style={[styles.timeLabel, {color: theme.colors.textMuted}]}>
                {new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short'}).format(now)} · {new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'}).format(now)}
              </Text>
            </View>
          </View>
          <TextInput
            ref={titleRef}
            value={title}
            onChangeText={onTitle}
            placeholder="Start with a title"
            placeholderTextColor={theme.colors.textFaint}
            selectionColor={accent}
            style={[styles.titleInput, {color: theme.colors.text}]}
            maxLength={160}
            returnKeyType="next"
          />
          <TextInput
            value={body}
            onChangeText={onBody}
            maxLength={50_000}
            placeholder="Write what you want to remember..."
            placeholderTextColor={theme.colors.textFaint}
            selectionColor={accent}
            multiline
            textAlignVertical="top"
            style={[styles.bodyInput, {color: theme.colors.text, borderColor: theme.colors.border}]}
          />
          <TextInput
            value={tags}
            onChangeText={onTags}
            maxLength={1000}
            placeholder="#daily, #ideas"
            placeholderTextColor={theme.colors.textFaint}
            selectionColor={accent}
            autoCapitalize="none"
            style={[styles.tagsInput, {color: theme.colors.textMuted}]}
          />
        </View>
        {error && <Text style={[styles.error, {color: theme.colors.danger}]}>{error}</Text>}
      </ScrollView>

      <RoundAction label="Save note" onPress={onSave} icon="check" accent={accent} bottom={0} />
    </Animated.View>
  );
}

function RoundAction({
  label,
  onPress,
  icon,
  accent,
}: {
  label: string;
  onPress(): void;
  icon: 'arrow' | 'check';
  accent?: string;
  bottom: number;
}) {
  const theme = useAppTheme();
  const Icon = icon === 'arrow' ? IconArrowRight : IconCheck;
  return (
    <View style={styles.roundActionWrap}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[
          styles.roundAction,
          {backgroundColor: theme.colors.button, borderColor: accent ?? theme.colors.surface},
        ]}>
        <Icon size={27} color={theme.colors.buttonText} strokeWidth={1.8} />
      </PressableScale>
    </View>
  );
}

function SaveAnimation({
  insets,
  note,
  onFinished,
}: {
  insets: EdgeInsets;
  note: Note;
  onFinished(): void;
}) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion
      ? withTiming(1, {duration: 120})
      : withSpring(1, {damping: 20, stiffness: 110, mass: 0.8});
    const timeout = setTimeout(onFinished, reduceMotion ? 220 : 1050);
    return () => clearTimeout(timeout);
  }, [onFinished, progress, reduceMotion]);

  const paperStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.82, 1], [1, 1, 0]),
    transform: [
      {translateY: interpolate(progress.value, [0, 1], [0, -152])},
      {scale: interpolate(progress.value, [0, 0.7, 1], [1, 0.62, 0.5])},
      {rotate: `${interpolate(progress.value, [0, 1], [0, -5])}deg`},
    ],
  }));
  const folderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0, 1]),
    transform: [{translateY: interpolate(progress.value, [0, 1], [130, 0])}],
  }));

  return (
    <Animated.View entering={FadeIn.duration(150)} style={[styles.saveStage, {paddingTop: insets.top, backgroundColor: theme.colors.background}]}>
      <Text style={[styles.savedTitle, {color: theme.colors.text}]}>Saved to Notes</Text>
      <Animated.View style={[styles.savePaper, {backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow}, paperStyle]}>
        <View style={styles.noteMeta}>
          <NoteGlyph icon={note.icon} accent={note.accent} size={40} />
          <Text style={[styles.savePaperTitle, {color: theme.colors.text}]} numberOfLines={2}>{note.title}</Text>
        </View>
        <Text style={[styles.savePaperBody, {color: theme.colors.textMuted}]} numberOfLines={3}>{note.body || 'No additional details'}</Text>
      </Animated.View>
      <Animated.View style={[styles.saveFolder, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}, folderStyle]}>
        <View style={[styles.saveFolderTab, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]} />
        <NoteGlyph icon="heart" accent="#FF8FB4" size={46} />
        <NoteGlyph icon="spark" accent="#72B8FF" size={46} />
        <NoteGlyph icon="check" accent="#9C82FF" size={46} />
        <View style={[styles.saveFolderPill, theme.dark ? styles.lavenderDark : styles.lavenderLight]}>
          <Text style={styles.saveFolderText}>Notes</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  stage: {flex: 1, paddingHorizontal: 20},
  stageHeader: {height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerSlot: {width: 42},
  headerCopy: {alignItems: 'center'},
  kicker: {fontSize: 11, fontWeight: '600'},
  headerTitle: {fontSize: 13, fontWeight: '700', marginTop: 2},
  closeButton: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  pickerContent: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40},
  pickerTitle: {fontSize: 27, lineHeight: 31, fontWeight: '700', textAlign: 'center', letterSpacing: -0.7},
  preview: {marginTop: 22, marginBottom: 28},
  iconGrid: {width: 282, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10},
  iconChoice: {width: 62, height: 62, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  roundActionWrap: {alignItems: 'center', height: 76, justifyContent: 'center'},
  roundAction: {width: 64, height: 64, borderRadius: 32, borderWidth: 4, alignItems: 'center', justifyContent: 'center'},
  writerContent: {alignItems: 'center', paddingTop: 10, paddingBottom: 90},
  prompt: {fontSize: 29, lineHeight: 32, fontWeight: '700', textAlign: 'center', letterSpacing: -0.8, marginBottom: 18},
  notePaper: {
    width: '100%',
    minHeight: 330,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 12},
    elevation: 7,
  },
  noteMeta: {flexDirection: 'row', alignItems: 'center', gap: 11},
  periodLabel: {fontSize: 14, fontWeight: '700'},
  timeLabel: {fontSize: 11, marginTop: 2},
  titleInput: {fontSize: 24, fontWeight: '700', marginTop: 20, paddingVertical: 4, letterSpacing: -0.4},
  bodyInput: {minHeight: 124, fontSize: 16, lineHeight: 23, paddingTop: 14, marginTop: 5, borderTopWidth: StyleSheet.hairlineWidth},
  tagsInput: {fontSize: 13, paddingVertical: 8, marginTop: 6},
  error: {fontSize: 13, fontWeight: '600', marginTop: 12},
  saveStage: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28},
  savedTitle: {fontSize: 26, fontWeight: '700', marginBottom: 42},
  savePaper: {width: '86%', minHeight: 210, borderRadius: 23, padding: 18, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: {width: 0, height: 10}, elevation: 8, zIndex: 2},
  savePaperTitle: {fontSize: 17, fontWeight: '700', flex: 1},
  savePaperBody: {fontSize: 14, lineHeight: 21, marginTop: 22},
  saveFolder: {
    width: 238,
    height: 144,
    borderRadius: 28,
    borderWidth: 1,
    marginTop: -20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 22,
  },
  saveFolderTab: {position: 'absolute', top: -18, right: 18, width: 88, height: 34, borderRadius: 18, borderWidth: 1},
  saveFolderPill: {position: 'absolute', bottom: 15, right: 16, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 9},
  saveFolderText: {color: '#7860D8', fontWeight: '700'},
  lavenderLight: {backgroundColor: '#E9E2FF'},
  lavenderDark: {backgroundColor: '#342C4D'},
});
