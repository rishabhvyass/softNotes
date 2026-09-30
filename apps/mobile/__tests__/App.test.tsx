/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

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
