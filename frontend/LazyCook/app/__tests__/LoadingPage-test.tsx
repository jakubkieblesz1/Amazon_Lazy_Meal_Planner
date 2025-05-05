import React from 'react';
import { render, act } from '@testing-library/react-native';
import LoadingScreen from '../LoadingPage';

// Mock the LottieView component
jest.mock('lottie-react-native', () => 'LottieView');

// Mock the animation files
jest.mock('../animations/ingredientsBowl.json', () => ({}), { virtual: true });
jest.mock('../animations/Cooking.json', () => ({}), { virtual: true });

describe('LoadingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with the initial loading message', () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText('Scanning ingredients...')).toBeTruthy();
  });

  it('cycles through all loading messages', () => {
    const { getByText } = render(<LoadingScreen />);

    // Initial message
    expect(getByText('Scanning ingredients...')).toBeTruthy();

    // Advance through all messages
    act(() => { jest.advanceTimersByTime(3000); });
    expect(getByText('Analyzing your preferences...')).toBeTruthy();

    act(() => { jest.advanceTimersByTime(3000); });
    expect(getByText('Creating meal plan...')).toBeTruthy();

    act(() => { jest.advanceTimersByTime(3000); });
    expect(getByText('Generating recipes...')).toBeTruthy();

    act(() => { jest.advanceTimersByTime(3000); });
    expect(getByText('Almost ready...')).toBeTruthy();
  });

  it('includes a LottieView animation component', () => {
    const { UNSAFE_getAllByType } = render(<LoadingScreen />);
    const lottieView = UNSAFE_getAllByType('LottieView')[0];

    expect(lottieView).toBeDefined();
    expect(lottieView.props.autoPlay).toBe(true);
    expect(lottieView.props.loop).toBe(true);
  });

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = render(<LoadingScreen />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});