import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MealSuggestions from '../MealSuggestions'; // Assuming the component file is in the same directory
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock vector-icons
jest.mock("@expo/vector-icons", () => ({
 MaterialIcons: jest.fn(),
 FontAwesome: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Sample recipe data
const mockRecipeData = {
  recipes: [
    {
      day_of_the_week: 'Monday',
      title: 'Chicken Alfredo Pasta',
      description: 'Creamy Alfredo sauce mixed with grilled chicken and fettuccine, garnished with Parmesan cheese.',
      difficulty: 'Medium',
      time_to_prepare: 30,
      servings: 4,
      ingredients: [
        { name: 'Chicken breast', quantity: '2 pieces' },
        { name: 'Fettuccine pasta', quantity: '250g' },
      ],
      instructions: ['Cook fettuccine according to package instructions.'],
    },
  ],
};

describe('MealSuggestions', () => {
  it('renders correctly with recipe data', async () => {
    const { getByText } = render(<MealSuggestions recipeData={mockRecipeData} />);

    // Check if the recipe title and description are rendered
    expect(getByText('Chicken Alfredo Pasta')).toBeTruthy();
    expect(getByText('Creamy Alfredo sauce mixed with grilled chicken and fettuccine, garnished with Parmesan cheese.')).toBeTruthy();
  });

  it('renders default placeholder when no recipe data is passed', async () => {
    const { getByText } = render(<MealSuggestions recipeData={null} />);

    // Check for the placeholder text
    expect(getByText('Chicken Alfredo Pasta')).toBeTruthy(); // This would match the placeholder
  });

  it('handles empty recipe list gracefully', async () => {
    const { queryByText } = render(<MealSuggestions recipeData={{ recipes: [] }} />);

    // The empty list should not have any meal title
    expect(queryByText('Chicken Alfredo Pasta')).toBeNull();
  });
});
