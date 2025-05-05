import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import MealSuggestions from './MealSuggestions';
import CameraWindow from './CameraWindow';
import LoadingScreen from './LoadingPage';
import PreferencesForm from './PreferencesForm';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGroceryStore } from './stores/groceryStore';

interface CardItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface SwipePreference {
  title: string;
  description: string;
  swipe: string;
}

interface RecipeData {
  recipes: Array<{
    day: string;
    title: string;
    description: string;
    difficulty: string;
    prep_time: number;
    servings: number;
    ingredients: Array<{
      name: string;
      quantity: string;
    }>;
    instructions: string[];
  }>;
}

interface SwipeableCardProps {
  data: CardItem[];
  onSwipeLeft: (item: CardItem) => void;
  onSwipeRight: (item: CardItem) => void;
  onShowSuggestions: () => void;
  onShowPreferencesForm: () => void;
  onShowLoading: (isLoading: boolean) => void; 
  onShowCamera: (showCamera: boolean) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

const SwipeableCard = ({ data, onSwipeLeft, onSwipeRight, onShowSuggestions, onShowPreferencesForm, onShowLoading, onShowCamera }: SwipeableCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(data.length);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);
  const [swipedPreferences, setSwipedPreferences] = useState<SwipePreference[]>([]);
  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.90, 1],
  });

  const nextCardTranslateY = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [0, 10, 0],
  });

  const [showTutorial, setShowTutorial] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const [cameraImageUri, setCameraImageUri] = useState<string | undefined>(undefined);

  const { hasGeneratedMeals } = useGroceryStore();

  const [nextCardReady, setNextCardReady] = useState(false);

  // Add new animated values for the teaser
  const teaserAnim = useRef(new Animated.Value(0)).current;
  const teaserY = useRef(new Animated.Value(0)).current;
  
  // Update teaser animation sequence
  const startTeaserAnimation = () => {
    Animated.sequence([
      // Wait before starting
      Animated.delay(500),
      // Move right and up
      Animated.parallel([
        Animated.timing(teaserAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(teaserY, {
          toValue: -0.4,
          duration: 1000,
          useNativeDriver: false,
        })
      ]),
      // Move left and up
      Animated.parallel([
        Animated.timing(teaserAnim, {
          toValue: -1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(teaserY, {
          toValue: -0.41,
          duration: 1000,
          useNativeDriver: false,
        })
      ]),
      // Back to center
      Animated.parallel([
        Animated.timing(teaserAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(teaserY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        })
      ])
    ]).start();
  };

  // Add effect to trigger teaser animation
  useEffect(() => {
    if (currentIndex === 0 && showTutorial) {
      startTeaserAnimation();
    }
  }, [currentIndex, showTutorial]);

  useEffect(() => {
    if (hasGeneratedMeals) {
      setCurrentIndex(data.length);
      setShowSuggestions(true);
      setShowCamera(false);
      setShowTutorial(false);
    } else {
      setCurrentIndex(0);
      setShowTutorial(true);
      setShowPreferencesForm(true);
      setShowCamera(false);
      setShowSuggestions(false);
    }
  }, [hasGeneratedMeals, data.length]);

  useEffect(() => {
    if (currentIndex < data.length && data[currentIndex + 1]) {
      const nextItem = data[currentIndex + 1];
      Image.prefetch(nextItem.image)
        .then(() => {
          setNextCardReady(true);
        })
        .catch(() => {
          setNextCardReady(true);
        });
    }
  }, [currentIndex, data]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        forceSwipe('right');
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        forceSwipe('left');
      } else {
        resetPosition();
      }
    },
  });

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const item = data[currentIndex];
    setSwipedPreferences((prev) => [
      ...prev,
      { id: item.id,
        title: item.title,
        description: item.description,
        difficulty: item.difficulty,
        prepTime: item.prepTime,
        servings: item.servings,
        ingredients: item.ingredients,
        instructions: item.instructions, 
        preference: direction === 'right' ? 'like' : 'dislike', 
      },
    ]);
    // sendPreference(item, direction === 'right' ? 'like' : 'dislike');
    // direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

    setSwipedPreferences((prev) => [
      ...prev,
      {
        title : item.title,
        description: item.description,
        swipe : direction == 'right' ? 'swiped right' : 'swiped left'
      }
    ]);
    
    if (currentIndex < data.length - 1) {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      setTimeout(() => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
        setShowPreferencesForm(true);
        onShowPreferencesForm();
      }, SWIPE_OUT_DURATION);
    }
  };

  const convertToBase64 = async () => {
    try {
      if (cameraImageUri) {
        console.log('Converting camera image to base64:', cameraImageUri);
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(cameraImageUri);
          console.log('File info:', JSON.stringify(fileInfo));
          
          if (fileInfo.exists) {
            try {
              let fileUri = cameraImageUri;
              
              console.log('Reading file as base64:', fileUri);
              const base64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              console.log('Successfully converted image to base64, length:', base64.length);
              return `data:image/jpeg;base64,${base64}`;
            } catch (readError) {
              console.error('Error reading file as base64:', readError);
            }
          } else {
            console.error('Camera image file does not exist:', cameraImageUri);
          }
        } catch (fileInfoError) {
          console.error('Error getting file info:', fileInfoError);
        }
      } else {
        console.log('No camera image URI available');
      }
      
      console.log('Falling back to ingredients.jpg');
      try {
        const asset = Asset.fromModule(require('./ingredients.jpg'));
        await asset.downloadAsync();
        
        if (asset.localUri) {
          console.log('Fallback image localUri:', asset.localUri);
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('Successfully converted fallback image to base64');
          return `data:image/jpeg;base64,${base64}`;
        } else {
          console.error('Failed to load fallback image - no localUri');
          return 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Empty 1x1 pixel as last resort
        }
      } catch (fallbackError) {
        console.error('Error loading fallback image:', fallbackError);
        return 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Empty 1x1 pixel
      }
    } catch (error) {
      console.error('Error in convertToBase64:', error);
      return 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Empty 1x1 pixel
    }
  }

  const handlePhotoCapture = async (imageUri?: string) => {
    let validImageUri: string | undefined = undefined;
    
    if (imageUri) {
      console.log('Received image URI from camera:', imageUri);
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('Image file info in handlePhotoCapture:', JSON.stringify(fileInfo));
        
        if (fileInfo.exists) {
          console.log('Image file exists with size:', fileInfo.size);
          validImageUri = imageUri;
        } else {
          console.error('Image file does not exist in handlePhotoCapture');
        }
      } catch (error) {
        console.error('Error checking image file in handlePhotoCapture:', error);
      }
    } else {
      console.log('No image URI received from camera');
    }
    
    setCameraImageUri(validImageUri);
    
    setShowCamera(false);
    onShowCamera(false);

    setShowLoading(true);
    onShowLoading(true);

    setTimeout(() => {
      console.log('Using image URI for API call:', validImageUri || 'fallback image');
      sendPreferencesAndImageWithUri(validImageUri);
    }, 500);
  };

  const handlePreferencesSubmit = () => {
    setShowPreferencesForm(false);
    setShowCamera(true);
    onShowCamera(true);
  }
  
  const sendPreferencesAndImageWithUri = async (imageUri?: string) => {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 60000)
    );
    
    try {
      let base64Image: string;
      
      if (imageUri) {
        try {
          console.log('Converting provided image URI to base64:', imageUri);
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          
          if (fileInfo.exists) {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log('Successfully converted provided image to base64, length:', base64.length);
            base64Image = `data:image/jpeg;base64,${base64}`;
          } else {
            console.error('Provided image file does not exist, using fallback');
            base64Image = await convertToBase64();
          }
        } catch (error) {
          console.error('Error converting provided image to base64:', error);
          base64Image = await convertToBase64();
        }
      } else {
        base64Image = await convertToBase64();
      }
      
      console.log('Image converted to base64, length:', base64Image.length);
      //retrieve session id 
      const storedSessionId = await AsyncStorage.getItem("sessionId");
      if (storedSessionId) {
        console.log("Retrieved Session ID:", storedSessionId);
      } else {
        console.warn("No session ID found in local storage.");
      }

      const requestBody = { 
        sessionId: storedSessionId,
        image: base64Image,
      };
      
      //console.log("Sending preferences data:", JSON.stringify({ preferences: swipedPreferences }));
      console.log("Image data included:", base64Image ? "Yes (length: " + base64Image.length + ")" : "No");

      // const target_url = "http://192.168.0.58:3000/generate-recipe"
      const target_url = "https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/analyse-picture"
      
      const fetchPromise = fetch(target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (response.ok) {
        console.log("Ingredients successfully analyzed")
      } else {
        const errorResponse = await response.json();
        console.error("Failed to analyze ingredients", errorResponse);
      }

      const generateRequestBody = { 
        sessionId: storedSessionId,
        preferences: swipedPreferences,
      };

      // Optional: Save the swipe preferences to AsyncStorage if needed
      try {
        await AsyncStorage.setItem('swipePreferences', JSON.stringify(swipedPreferences));
      } catch (error) {
        console.warn('Error saving swipe preferences:', error);
      }

      const generate_target_url = "https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/generate-recipe"

      const generate_fetchPromise = fetch(generate_target_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generateRequestBody),
      });

      const generate_response = await Promise.race([generate_fetchPromise, timeoutPromise]) as Response;

      if (generate_response.ok) {
        console.log('Preferences sent successfully to Gemini endpoint');
        const responseData = await generate_response.json();
        console.log('Response data:', responseData);
        
        try {
          // Add detailed logging to understand the response structure
          console.log('Response type:', typeof responseData);
          
          // Parse the response if it's a string
          let parsedData = responseData;
          if (typeof responseData === 'string') {
            try {
              console.log('Attempting to parse response as JSON string');
              parsedData = JSON.parse(responseData);
              console.log('Successfully parsed response string');
            } catch (parseError) {
              console.error('Failed to parse response string:', parseError);
            }
          }
          
          console.log('Parsed data type:', typeof parsedData);
          console.log('Has recipes property:', parsedData.hasOwnProperty('recipes'));
          console.log('Recipes type:', typeof parsedData.recipes);
          console.log('Is recipes an array:', Array.isArray(parsedData.recipes));
          
          // Check if the response is already a JSON object or a string that needs parsing
          let parsedRecipes;
          if (typeof parsedData.recipe === 'string') {
            // Handle the old format where recipe is a string that needs parsing
            parsedRecipes = JSON.parse(parsedData.recipe.replace(/'/g, '"'));
          } else if (parsedData.recipe && typeof parsedData.recipe === 'object') {
            // Handle nested recipe object format - like {"recipe": {"recipe": {...}}}
            if (parsedData.recipe.recipe && typeof parsedData.recipe.recipe === 'object') {
              console.log('Found doubly nested recipe object structure');
              parsedRecipes = parsedData.recipe.recipe;
            } else {
              console.log('Found singly nested recipe object structure');
              parsedRecipes = parsedData.recipe;
            }
          } else if (parsedData.recipes && Array.isArray(parsedData.recipes)) {
            // Handle the case where parsedData already has a recipes array
            console.log('Found recipes array with', parsedData.recipes.length, 'items');
            parsedRecipes = parsedData;
          } else if (parsedData.recipes) {
            // Fallback for when recipes exists but isn't detected as an array
            console.log('Found recipes property but not an array, attempting to use it anyway');
            parsedRecipes = parsedData;
          } else {
            // Handle other formats
            console.log('Unexpected response format:', parsedData);
            parsedRecipes = { recipes: [] };
          }
          
          console.log('Final parsed recipes:', parsedRecipes);
          setRecipeData(parsedRecipes);
          
          if (responseData.recipe?.recipe?.grocery_list) {
            useGroceryStore.getState().setGroceryList(responseData.recipe.recipe.grocery_list);
            useGroceryStore.getState().setHasGeneratedMeals(true);
          }
          
          setShowLoading(false);
          setShowSuggestions(true);
          onShowSuggestions(true);
        } catch (parseError) {
          console.error('Error parsing recipe data:', parseError);
          setShowLoading(false);
          setShowSuggestions(true);
          onShowSuggestions(true);
        }
      } else {
        const errorResponse = await response.json();
        console.error('Failed to send preferences to Gemini endpoint', errorResponse);
        setTimeout(() => {
          setShowLoading(false);
        setShowSuggestions(true);
        onShowSuggestions(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending preferences to Gemini endpoint:', error);
      setTimeout(() => {
        setShowSuggestions(true);
        setShowLoading(false);
        onShowSuggestions();
      }, 2000);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  // Modify the getCardStyle function to include the teaser animation
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
    });

    // Add teaser rotation and movement
    const teaserRotate = teaserAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-5deg', '0deg', '5deg'],
    });

    const teaserTranslateX = teaserAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [-30, 0, 30],
    });

    const teaserTranslateY = teaserY.interpolate({
      inputRange: [-1, 0],
      outputRange: [-10, 0],
    });

    if (showTutorial && currentIndex === 0) {
      return {
        ...position.getLayout(),
        transform: [
          { translateX: teaserTranslateX },
          { translateY: teaserTranslateY },
          { rotate: teaserRotate }
        ],
      };
    }

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  const renderCards = () => {
    if (currentIndex >= data.length) {
      return (
        <View style={styles.noMoreCards}>
          {showPreferencesForm ? (
            <PreferencesForm onSubmit={handlePreferencesSubmit} />
          ) : showCamera ? (
            <CameraWindow onPhotoCapture={handlePhotoCapture} />
          ) : showLoading ? (
            <LoadingScreen />
          ) : (
            <MealSuggestions recipeData={recipeData} />
          )}
        </View>
      );
    }

    return data
      .map((item: CardItem, i: number) => {
        if (i < currentIndex) return null;

        if (i === currentIndex) {
          return (
            <Animated.View
              key={item.id}
              style={[getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
              {...panResponder.panHandlers}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.cardImage}
                onLoad={() => setImageLoaded(prev => ({ ...prev, [item.id]: true }))}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              
              {showTutorial && currentIndex === 0 && (
                <TouchableWithoutFeedback onPress={() => setShowTutorial(false)}>
                  <View style={styles.tutorialContainer}>
                    <View style={styles.tutorialOverlay} />
                    <View style={styles.tutorialDivider} />
                    <View style={styles.tutorialLeft}>
                      <Text style={styles.tutorialText}>Swipe left{'\n'}to dislike</Text>
                    </View>
                    <View style={styles.tutorialRight}>
                      <Text style={styles.tutorialText}>Swipe right{'\n'}to like</Text>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </Animated.View>
          );
        }

        if (i === currentIndex + 1) {
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardStyle,
                {
                  transform: nextCardReady ? [
                    { translateY: nextCardTranslateY },
                    { scale: nextCardScale }
                  ] : [],
                  zIndex: 98,
                }
              ]}
            >
              <Image 
                source={{ uri: item.image }} 
                style={styles.cardImage}
                onLoad={() => setImageLoaded(prev => ({ ...prev, [item.id]: true }))}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </Animated.View>
          );
        }

        return null;
      })
      .reverse();
  };

  return <View style={styles.container}>{renderCards()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
  },
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH - 60,
    height: 600,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardImage: {
    width: '100%',
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 20,
    paddingTop: 17,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  noMoreCards: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 120,
    width: '100%',
  },
  noMoreCardsText: {
    fontSize: 18,
    color: '#666',
  },
  tutorialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tutorialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    opacity: 0.7,
  },
  tutorialDivider: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    left: '50%',
    width: 2,
    backgroundColor: 'white',
    transform: [{ translateX: -1 }],
  },
  tutorialLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SwipeableCard;