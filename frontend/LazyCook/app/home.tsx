import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import SwipeableCard from './SwipeableCard';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useGroceryStore } from './stores/groceryStore';

interface Recipe {
  id: string;
  image: string;
  title: string;
  description: string;
}

const DUMMY_DATA: Recipe[] = [
  {
    id: '1',
    image: 'https://blueskyeating.com/wp-content/uploads/2021/02/lemon-and-garlic-chicken-tray-bake-680_7.jpg',
    title: 'Lemon Garlic Chicken with Roasted Vegetables',
    description: 'Zesty marinated chicken baked to perfection alongside a colorful medley of carrots, broccoli, and potatoes.',
  },
  {
    id: '2',
    image: 'https://workweeklunch.com/wp-content/uploads/2022/10/spaghetti.bolognese-4.jpg',
    title: 'Spaghetti Bolognese',
    description: 'A classic Italian favorite with rich ground beef, garlic, and onions simmered in a robust tomato sauce over al dente pasta.',
  },
  {
    id: '3',
    image: 'https://diethood.com/wp-content/uploads/2024/07/salmon-en-papillote-5.jpg',
    title: 'Salmon en Papillote',
    description: 'Salmon fillet baked in parchment paper with lemon slices, fresh herbs, and seasonal veggies for a light, flaky meal.',
  },
  {
    id: '4',
    image: 'https://www.skinnytaste.com/wp-content/uploads/2021/09/Tofu-Stir-Fry-8.jpg',
    title: 'Vegetable Stir-Fry with Tofu',
    description: 'Crispy tofu and mixed vegetables tossed in a savory soy-ginger sauce, served over steamed rice or noodles.',
  },
  {
    id: '5',
    image: 'https://www.simplyrecipes.com/thmb/TSODFyhHhFiPz9auo2V0BFUckT4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Simply-Recipes-Creamy-Tuscan-Chicken-LEAD-2-2-Crop-b6a96faeda9a4744924bab606ab6e059.jpg',
    title: 'Creamy Tuscan Chicken',
    description: 'Seared chicken breasts in a creamy sauce with sun-dried tomatoes, spinach, garlic, and a touch of parmesan.',
  },
  {
    id: '6',
    image: 'https://www.sixsistersstuff.com/wp-content/uploads/2018/10/Beef-and-Broccoli-without-Sauce-1-of-1.jpg',
    title: 'Beef and Broccoli Teriyaki',
    description: 'Tender beef strips and broccoli florets stir-fried in a sweet and tangy teriyaki glaze, perfect with fluffy white rice.',
  },
  {
    id: '7',
    image: 'https://feelgoodfoodie.net/wp-content/uploads/2017/03/Quinoa-Stuffed-Peppers-12.jpg',
    title: 'Quinoa-Stuffed Bell Peppers',
    description: 'Vibrant bell peppers filled with a hearty mix of quinoa, black beans, corn, and cheese, then baked until bubbly.',
  },
  {
    id: '8',
    image: 'https://www.eatingbirdfood.com/wp-content/uploads/2024/04/healthy-chicken-fajitas-hero-new.jpg',
    title: 'Chicken Fajitas',
    description: 'Juicy chicken strips with bell peppers and onions, marinated in Mexican spices, served sizzling with warm tortillas.',
  },
];

export default function HomeScreen() {
  const [showingSuggestions, setShowingSuggestions] = useState(false);
  const [showingCamera, setShowingCamera] = useState(false);
  const [showingPreferencesForm, setShowingPreferencesForm] = useState(false);
  const [showingLoading, setShowingLoading] = useState(false);
  const [showingPreferences, setShowingPreferences] = useState(false);
  const [showingWelcome, setShowingWelcome] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const { hasGeneratedMeals } = useGroceryStore();

  useEffect(() => {
    if (hasGeneratedMeals) {
      setShowingSuggestions(true);
      setShowingCamera(false);
    }
  }, [hasGeneratedMeals]);

  const getGreeting = () => {
    if (showingSuggestions) {
      return 'Your meal plan';
    }
    if (showingPreferencesForm) {
      return 'Your meal settings';
    }
    if (showingCamera) {
      return 'Take a picture of your ingredients';
    }
    if (showingLoading) {
      return 'Take a picture of your ingredients';
    }
    if (showingWelcome) {
      const hour = new Date().getHours();
      const name = 'Alex'; // You might want to get this from user settings/context
      if (hour < 12) return `Good morning, ${name}`;
      if (hour < 18) return `Good afternoon, ${name}`;
      return `Good evening, ${name}`;
    }
  };

  const getSubtitle = () => {
    if (showingPreferencesForm) {
      return 'What do you prefer?';
    }
    if (showingCamera) {
      return 'Let\'s see what you have';
    }
    if (showingSuggestions) {
      return 'Enjoy!';
    }
    if (showingWelcome) {
      return 'Hungry?';
    }
    if (showingLoading) {
      return '';
    }
  };

  const animateGreeting = (callback: () => void) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Update state when fully faded out
      if (callback) callback();
      
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSwipeLeft = (item: Recipe) => {
    console.log('Swiped left on:', item.title);
  };

  const handleSwipeRight = (item: Recipe) => {
    console.log('Swiped right on:', item.title);
  };

  return (
    <View style={styles.container}>
      <View style={styles.upperContainer}>
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          {getGreeting()}
        </Animated.Text>
        {!showingCamera && (
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
            {getSubtitle()}
          </Animated.Text>
        )}
        <SwipeableCard
          data={DUMMY_DATA}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onShowSuggestions={() => {
            animateGreeting(() => {
              setShowingSuggestions(true);
              setShowingLoading(false);
              setShowingPreferencesForm(false);
              setShowingCamera(false);
            });
          }}
          onShowPreferencesForm={() => {
            animateGreeting(() => {
              setShowingPreferences(true);
              setShowingPreferencesForm(true);
              setShowingCamera(false);
              setShowingSuggestions(false);
              setShowingWelcome(false);
            });
          }}
          onShowCamera={(showCamera) => {
            console.log('onShowCamera called with:', showCamera);
            if (showCamera) {
              animateGreeting(() => {
                setShowingCamera(true);
                setShowingPreferencesForm(false);
                setShowingSuggestions(false);
              });
            } else {
              setShowingCamera(false);
            }
          }}
          onShowLoading={(isLoading) => {
            setShowingLoading(isLoading);
          }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.navButton}>
          <MaterialIcons name="home-filled" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => router.push('/GroceryPage')}
        >
          <FontAwesome name="shopping-cart" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Groceries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}
          onPress={() => router.push('/settings')}
        >
          <MaterialIcons name="settings" size={28} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09253F',
    height: '100%',
  },
  upperContainer: {
    flex: 1,
    backgroundColor: '#09253F',
    paddingHorizontal: 30,
    marginTop: -20,
  },
  title: {
    fontSize: 34,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: '30%',
  },
  subtitle: {
    fontSize: 34,
    fontWeight: '500',
    color: '#7B7B7B',
    marginTop: 0,
  },
  buttonContainer: {
    width: '100%',
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A3A56',
  },
  navButton: {
    marginTop: 6,
    padding: 10,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});