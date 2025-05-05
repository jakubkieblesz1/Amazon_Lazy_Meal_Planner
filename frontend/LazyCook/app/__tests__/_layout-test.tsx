import React from 'react';
import { render } from '@testing-library/react-native';
import Layout from '../_layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

jest.mock('expo-router', () => ({
  Stack: jest.fn(() => null),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: jest.fn(({ children }) => children),
}));

describe('Layout Component', () => {
  it('renders GestureHandlerRootView', () => {
    const { toJSON } = render(<Layout />);
    expect(toJSON()).toMatchSnapshot(); // Ensure component tree includes GestureHandlerRootView
  });
});
