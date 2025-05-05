import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LoadingScreen() {
  const [loadingPhase, setLoadingPhase] = useState(0);
  const loadingMessages = [
    'Scanning ingredients...',
    'Analyzing your preferences...',
    'Creating meal plan...',
    'Generating recipes...',
    'Almost ready...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingPhase(prev => {
        return prev < loadingMessages.length - 1 ? prev + 1 : prev;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={
          loadingPhase >= 2 
            ? require('../animations/Cooking.json')  
            : require('../animations/ingredientsBowl.json') 
        }
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={styles.text}>
        {loadingMessages[loadingPhase]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -50,
  },
  animation: {
    width: 185,  
    height: 185, 
  },
  text: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
