import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the RecipeData interface with the new format
interface RecipeData {
  recipes: Array<{
    day_of_the_week: string;
    title: string;
    description: string;
    difficulty: string;
    time_to_prepare: number;
    servings: number;
    ingredients: Array<{
      name: string;
      quantity: string;
    }>;
    instructions: string[];
  }>;
}

interface MealSuggestionsProps {
  recipeData: RecipeData | null;
}

// Define the suggestion item interface to include day
interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  prepTime: string | number;
  servings: number;
  ingredients: Array<string | { name: string; quantity: string }>;
  instructions: string[];
  dayOfWeek?: string;
}

const StarRating = ({ 
  rating, 
  setRating, 
  recipeTitle 
}: { 
  rating: number, 
  setRating: (title: string, rating: number) => void,
  recipeTitle: string
}) => {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>How was this recipe?</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(recipeTitle, star)}
            style={styles.starButton}
          >
            <MaterialIcons
              name={rating >= star ? "star" : "star-border"}
              size={28}
              color={rating >= star ? "#FFD700" : "#CCCCCC"}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.thankYouText}>
          Thanks for your {rating}-star rating!
        </Text>
      )}
    </View>
  );
};


const placeholderSuggestions: SuggestionItem[] = [
  {
    id: '1',
    title: 'Chicken Alfredo Pasta',
    description: 'Creamy Alfredo sauce mixed with grilled chicken and fettuccine, garnished with Parmesan cheese.',
    difficulty: 'Medium',
    prepTime: 30,
    servings: 4,
    ingredients: [
      { name: 'Chicken breast', quantity: '2 pieces' },
      { name: 'Fettuccine pasta', quantity: '250g' },
      { name: 'Heavy cream', quantity: '1 cup' },
      { name: 'Parmesan cheese', quantity: '1 cup' },
      { name: 'Butter', quantity: '2 tablespoons' },
      { name: 'Garlic', quantity: '2 cloves' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'Cook fettuccine according to package instructions.',
      'Season chicken breasts with salt and pepper, then grill until fully cooked.',
      'In a pan, melt butter and sauté minced garlic.',
      'Add heavy cream and bring to a simmer.',
      'Mix in Parmesan cheese until melted.',
      'Slice chicken and add to sauce.',
      'Combine with fettuccine and serve hot.'
    ],
    dayOfWeek: 'Monday'
  },
  {
    id: '2',
    title: 'Beef Stir-Fry with Broccoli',
    description: 'Quick and easy stir-fry with tender beef and fresh broccoli in a savory sauce.',
    difficulty: 'Medium',
    prepTime: 25,
    servings: 4,
    ingredients: [
      { name: 'Beef strips', quantity: '300g' },
      { name: 'Broccoli', quantity: '1 head' },
      { name: 'Soy sauce', quantity: '3 tablespoons' },
      { name: 'Garlic', quantity: '2 cloves' },
      { name: 'Ginger', quantity: '1 inch piece' },
      { name: 'Sesame oil', quantity: '1 tablespoon' },
      { name: 'Cornstarch', quantity: '1 teaspoon' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'In a bowl, mix beef strips with soy sauce, minced garlic, grated ginger, cornstarch, salt, and pepper.',
      'Heat sesame oil in a pan, then add marinated beef.',
      'Stir-fry until beef is browned.',
      'Add broccoli florets and stir-fry until tender.',
      'Serve hot with rice or noodles.'
    ],
    dayOfWeek: 'Tuesday'
  },
  {
    id: '3',
    title: 'Butternut Squash Soup',
    description: 'Creamy, smooth soup made with roasted butternut squash, ideal for a cozy evening.',
    difficulty: 'Easy',
    prepTime: 40,
    servings: 4,
    ingredients: [
      { name: 'Butternut squash', quantity: '1 medium' },
      { name: 'Onion', quantity: '1 large' },
      { name: 'Garlic', quantity: '2 cloves' },
      { name: 'Vegetable broth', quantity: '4 cups' },
      { name: 'Olive oil', quantity: '2 tablespoons' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' },
      { name: 'Sour cream', quantity: 'for garnish' }
    ],
    instructions: [
      'Preheat oven to 200°C (400°F).',
      'Cut the butternut squash into chunks and toss with olive oil, salt, and pepper.',
      'Roast in the oven for 20-25 minutes until tender.',
      'Sauté chopped onion and garlic in a pot until translucent.',
      'Add roasted squash and vegetable broth.',
      'Simmer for 10 minutes, then blend until smooth.',
      'Serve hot, garnished with sour cream.'
    ],
    dayOfWeek: 'Wednesday'
  },
  {
    id: '4',
    title: 'Chicken Caesar Salad Wraps',
    description: 'Fresh and flavorful Caesar salad wrapped in a tortilla with grilled chicken, Parmesan, and crisp lettuce.',
    difficulty: 'Easy',
    prepTime: 15,
    servings: 4,
    ingredients: [
      { name: 'Chicken breast', quantity: '2 pieces' },
      { name: 'Romaine lettuce', quantity: '1 head' },
      { name: 'Tortilla wraps', quantity: '4' },
      { name: 'Parmesan cheese', quantity: '1/2 cup' },
      { name: 'Caesar dressing', quantity: '1/2 cup' },
      { name: 'Croutons', quantity: '1 cup' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'Grill chicken breasts and slice them.',
      'Mix Caesar dressing with chopped romaine lettuce and croutons.',
      'Lay the mixture onto a tortilla wrap.',
      'Add sliced chicken and grated Parmesan.',
      'Wrap tightly and cut in half to serve.'
    ],
    dayOfWeek: 'Thursday'
  },
  {
    id: '5',
    title: 'Beef Tacos',
    description: 'Juicy beef tacos with fresh toppings served in crispy taco shells.',
    difficulty: 'Medium',
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: 'Ground beef', quantity: '400g' },
      { name: 'Taco shells', quantity: '8' },
      { name: 'Onion', quantity: '1 small' },
      { name: 'Tomato', quantity: '1 large' },
      { name: 'Lettuce', quantity: '1 head' },
      { name: 'Cheddar cheese', quantity: '1 cup' },
      { name: 'Taco seasoning', quantity: '2 tablespoons' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'Cook ground beef with taco seasoning, salt, and pepper.',
      'Chop onions, tomatoes, and lettuce.',
      'Fill taco shells with beef, then top with vegetables and cheese.',
      'Serve immediately.'
    ],
    dayOfWeek: 'Friday'
  },
  {
    id: '6',
    title: 'Garlic Butter Shrimp with Rice',
    description: 'Succulent shrimp cooked in garlic butter sauce served over fluffy rice.',
    difficulty: 'Easy',
    prepTime: 25,
    servings: 4,
    ingredients: [
      { name: 'Shrimp', quantity: '400g' },
      { name: 'Garlic', quantity: '4 cloves' },
      { name: 'Butter', quantity: '3 tablespoons' },
      { name: 'Rice', quantity: '2 cups' },
      { name: 'Lemon juice', quantity: '2 tablespoons' },
      { name: 'Parsley', quantity: 'a handful' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'Cook rice according to package instructions.',
      'Melt butter in a pan and sauté minced garlic.',
      'Add shrimp, salt, and pepper, cook until pink.',
      'Add lemon juice and chopped parsley.',
      'Serve shrimp over cooked rice.'
    ],
    dayOfWeek: 'Saturday'
  },
  {
    id: '7',
    title: 'Cheesy Eggplant Parmesan',
    description: 'Baked eggplant topped with tomato sauce and cheese for a satisfying vegetarian meal.',
    difficulty: 'Medium',
    prepTime: 35,
    servings: 4,
    ingredients: [
      { name: 'Eggplant', quantity: '2 large' },
      { name: 'Tomato sauce', quantity: '2 cups' },
      { name: 'Mozzarella cheese', quantity: '2 cups' },
      { name: 'Parmesan cheese', quantity: '1/2 cup' },
      { name: 'Breadcrumbs', quantity: '1 cup' },
      { name: 'Olive oil', quantity: '3 tablespoons' },
      { name: 'Salt', quantity: 'to taste' },
      { name: 'Pepper', quantity: 'to taste' }
    ],
    instructions: [
      'Preheat the oven to 180°C (350°F).',
      'Slice eggplants and season with salt, pepper, and olive oil.',
      'Bake eggplants for 15 minutes until tender.',
      'Layer eggplant slices in a baking dish, cover with tomato sauce, and top with cheeses.',
      'Sprinkle breadcrumbs and bake for another 20 minutes until the cheese is bubbly.',
      'Serve hot.'
    ],
    dayOfWeek: 'Sunday'
  }
];

const MealSuggestions = ({ recipeData }: MealSuggestionsProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      delay: 300, 
    }).start();
  }, []);

  const sendRatingToAPI = async (recipeTitle: string, rating: number) => {

    try {
      const storedSessionId = await AsyncStorage.getItem("sessionId");
      if (storedSessionId) {
        console.log("Retrieved Session ID:", storedSessionId);
      } else {
        console.warn("No session ID found in local storage.");
      }

      console.log(recipeTitle, rating);

      const requestBody = {
        sessionId: storedSessionId,
        recipeTitle: recipeTitle,
        feedback: rating,
      };

      const response = await fetch('https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save rating');
      }

      const data = await response.json();
      console.log('Rating saved successfully:', data);

    } catch (error) {
      console.error('Error saving rating', error);
    }
  };

  const handleRating = (title: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [title]: rating
    }));



    console.log(`Recipe "${title}" rated: ${rating} stars`);

    sendRatingToAPI(title, rating);
  };

  const suggestions = recipeData?.recipes 
    ? recipeData.recipes.map((recipe, index) => ({
        id: index.toString(),
        title: recipe.title,
        description: recipe.description,
        difficulty: recipe.difficulty,
        prepTime: recipe.time_to_prepare,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        dayOfWeek: recipe.day_of_the_week
      }))
    : placeholderSuggestions;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Animated.View 
            style={[
              styles.suggestionCard,
              { 
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }]
              }
            ]}
          >
            {item.dayOfWeek && (
              <Text style={styles.dayOfWeek}>{item.dayOfWeek}</Text>
            )}
            <Text style={styles.suggestionTitle}>{item.title}</Text>
            <Text style={styles.suggestionDescription}>{item.description}</Text>
            <View style={styles.mealDetails}>
              <Text style={styles.detailText}>Difficulty: {item.difficulty}</Text>
              <Text style={styles.detailText}>Prep Time: {typeof item.prepTime === 'number' ? `${item.prepTime} mins` : item.prepTime}</Text>
              <Text style={styles.detailText}>Servings: {item.servings}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients:</Text>
              {item.ingredients?.map((ingredient, index) => (
                <Text key={index} style={styles.listItem}>
                  • {typeof ingredient === 'string' 
                      ? ingredient 
                      : `${ingredient.name} (${ingredient.quantity})`}
                </Text>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions:</Text>
              {item.instructions?.map((instruction, index) => (
                <Text key={index} style={styles.listItem}>{index + 1}. {instruction}</Text>
              ))}
            </View>

            <StarRating
              rating={ratings[item.title] || 0}
              setRating={handleRating}
              recipeTitle={item.title}
            />

          </Animated.View>
        )}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: -10,
    marginBottom: -120,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dayOfWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09253F',
    marginBottom: 10,
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: -2,
  },
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },

  ratingContainer: {
    marginTop: 10,
    borderTopWidth: 1, 
    borderTopColor: '#eaeaea',
    paddingTop: 12,
  },
  ratingLabel: {
    fontSize: 16, 
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 5,
  },
  thankYouText: {
    textAlign: 'center',
    color: '#09253F',
    fontSize: 14,
    marginTop: 0,
    fontWeight: '500',
  }

});

export default MealSuggestions;
