/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => { await AsyncStorage.clear(); });

test('renders the notes library and opens the icon picker', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Create a new note'}).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => {
    renderer.root.findAllByProps({accessibilityLabel: 'Create a new note'})[0].props.onPress();
  });
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Continue to write'}).length).toBeGreaterThan(0);
  expect(renderer.root.findAllByProps({accessibilityLabel: 'spark icon'}).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => renderer.unmount());
});

test('recovers a compose draft and saves it into the library', async () => {
  jest.useFakeTimers();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => { renderer = ReactTestRenderer.create(<App />); });
  const press = (label: string) => ReactTestRenderer.act(async () => {
    renderer.root.findAllByProps({accessibilityLabel: label})[0].props.onPress();
  });
  await press('Create a new note');
  await press('Continue to write');
  await ReactTestRenderer.act(async () => {
    renderer.root.findAllByProps({accessibilityLabel: 'Note title'})[0].props.onChangeText('My recovered draft');
    renderer.root.findAllByProps({accessibilityLabel: 'Note body'})[0].props.onChangeText('A thought worth keeping.');
  });
  await press('Close');
  await press('Create a new note');
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Note title'})[0].props.value).toBe('My recovered draft');
  await press('Save note');
  await ReactTestRenderer.act(async () => { jest.advanceTimersByTime(1200); });
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Create a new note'}).length).toBeGreaterThan(0);
  expect(renderer.root.findAllByProps({children: 'My recovered draft'}).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => renderer.unmount());
  jest.useRealTimers();
});
