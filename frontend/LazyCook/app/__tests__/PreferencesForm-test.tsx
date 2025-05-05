import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PreferencesScreen from '../PreferencesForm'; // Adjust the import as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

// Ensure AsyncStorage is mocked
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the WebBrowser module
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({}),
}));

// Globally mock fetch so that the API call in PreferencesScreen resolves successfully.
beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

describe('PreferencesScreen', () => {
  const onSubmitMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial screen with the first question', () => {
    const { getByText } = render(<PreferencesScreen onSubmit={onSubmitMock} />);
    expect(getByText('Do you have any dietary requirements?')).toBeTruthy();
  });

  it('should allow user to input dietary preference', () => {
    const { getByPlaceholderText } = render(<PreferencesScreen onSubmit={onSubmitMock} />);
    const dietInput = getByPlaceholderText('e.g. Vegan, Vegetarian, Keto');
    fireEvent.changeText(dietInput, 'Vegan');
    expect(dietInput.props.value).toBe('Vegan');
  });

  it('should go to the next question when the Next button is pressed', async () => {
    const { getByText } = render(<PreferencesScreen onSubmit={onSubmitMock} />);
    const nextButton = getByText('Next');

    await act(async () => {
      fireEvent.press(nextButton);
    });

    await waitFor(() => {
      expect(getByText('What is your budget per week?')).toBeTruthy();
    });
  });

  it('should call handleSubmit when the final step is reached', async () => {
    const { getByText } = render(<PreferencesScreen onSubmit={onSubmitMock} />);
    const nextButton = getByText('Next');

    // Advance through the form (7 Next presses for 8 steps)
    for (let i = 0; i < 7; i++) {
      await act(async () => {
        fireEvent.press(nextButton);
      });
    }

    // Now we should be on the final step with the Submit button
    const submitButton = getByText('Submit');
    await act(async () => {
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should save preferences to AsyncStorage on submit', async () => {
    const storedSessionId = 'session-id';
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(storedSessionId);

    const { getByText } = render(<PreferencesScreen onSubmit={onSubmitMock} />);

    // Advance through all steps to reach the "Submit" button (7 steps)
    for (let i = 0; i < 7; i++) {
      await act(async () => {
        fireEvent.press(getByText('Next'));
      });
    }

    const submitButton = getByText('Submit');
    await act(async () => {
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('sessionId');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'userPreferences',
        expect.any(String)
      );
    });
  });
});