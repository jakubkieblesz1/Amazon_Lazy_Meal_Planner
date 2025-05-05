import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

export default function PreferencesScreen({ onSubmit }: { onSubmit: () => void }) {
  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState('');
  const [budget, setBudget] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [allergens, setAllergens] = useState('');
  const [kitchenEquipment, setKitchenEquipment] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [notifications, setNotifications] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const progress = useState(new Animated.Value((step + 1) / 8))[0];
  const [fitbit_token, setFitbit_token] = useState('');

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (step + 1) / 8,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const handleConnectFitbit = async () => {
    const clientId = '23QC6W';
    const responseType = 'token';
    const scope = 'activity nutrition weight profile'; 
    const redirectUrl = 'https://mchugha2.github.io/'; 

    const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
      `response_type=${responseType}` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}` + 
      `&scope=${encodeURIComponent(scope)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl);

    // add token to preference form
    if (result.type === "success" && result.url){
      console.log(result.url)
      setFitbit_token(result.url)
    }


    console.log(result);
  };
  
  const questions = [
    {
      label: 'Do you have any dietary requirements?',
      input: (
        <TextInput
          style={styles.input}
          placeholder="e.g. Vegan, Vegetarian, Keto"
          placeholderTextColor="#8E8E93"
          value={diet}
          onChangeText={setDiet}
        />
      ),
    },
    {
      label: 'What is your budget per week?',
      input: (
        <TextInput
          style={styles.input}
          placeholder="e.g. €50, €100, €200"
          placeholderTextColor="#8E8E93"
          value={budget}
          onChangeText={setBudget}
        />
      ),
    },
    {
      label: 'Do you have any preferred cuisines?',
      input: (
        <TextInput
          style={styles.input}
          placeholder="e.g. Italian, Asian, Mexican"
          placeholderTextColor="#8E8E93"
          value={cuisines}
          onChangeText={setCuisines}
        />
      ),
    },
    {
      label: 'Do you have any food allergens?',
      input: (
        <TextInput
          style={styles.input}
          placeholder="e.g. Nuts, Dairy, Gluten"
          placeholderTextColor="#8E8E93"
          value={allergens}
          onChangeText={setAllergens}
        />
      ),
    },
    {
      label: 'What kitchen equipment do you have?',
      input: (
        <TextInput
          style={styles.input}
          placeholder="e.g. Oven, Air Fryer, Blender"
          placeholderTextColor="#8E8E93"
          value={kitchenEquipment}
          onChangeText={setKitchenEquipment}
        />
      ),
    },
    {
      label: 'How many people are you cooking for?',
      input: (
        <>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setIsPickerVisible(true)}>
            <Text style={styles.pickerButtonText}>{numberOfPeople}</Text>
          </TouchableOpacity>

          <Modal visible={isPickerVisible} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={numberOfPeople}
                  onValueChange={(itemValue) => setNumberOfPeople(itemValue)}
                  style={styles.picker}
                >
                  {[...Array(10).keys()].map((num) => (
                    <Picker.Item
                      key={num + 1}
                      label={`${num + 1}`}
                      value={`${num + 1}`}
                      color="#000"
                    />
                  ))}
                </Picker>
                <Button mode="contained" onPress={() => setIsPickerVisible(false)} style={styles.doneButton}>
                  Done
                </Button>
              </View>
            </View>
          </Modal>
        </>
      ),
    },
    {
      label: 'Would you like to connect to your Fitbit?',
      input: (
        <View>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={handleConnectFitbit}
          >
            <Text style={styles.connectButtonText}>Connect to Fitbit</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      label: 'Would you like to receive notifications?',
      input: (
        <View style={styles.yesNoContainer}>
          <TouchableOpacity
            style={[
              styles.yesNoButton, 
              notifications === false && styles.selectedButton,
            ]}
            onPress={() => setNotifications(false)}
          >
            <Text style={[styles.yesNoText, notifications === false && styles.selectedText]}>
              No
              </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton, 
              notifications === true && styles.selectedButton,
            ]}
            onPress={() => setNotifications(true)}
          >
            <Text style={[styles.yesNoText, notifications === true && styles.selectedText]}>
              Yes
              </Text>
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const handleSubmit = async () => {
    onSubmit();

    try {
      const storedSessionId = await AsyncStorage.getItem("sessionId");
      if (storedSessionId) {
        console.log("Retrieved Session ID:", storedSessionId);
      } else {
        console.warn("No session ID found in local storage.");
      }

      const preferences = {
        diet: diet.trim() || "n/a",
        budget: budget.trim() || "n/a",
        cuisines: cuisines.trim() || "n/a",
        allergens: allergens.trim() || "n/a",
        kitchen_equipment: kitchenEquipment.trim() || "n/a",
        number_of_people: numberOfPeople,
        notification_options: notifications.toString(),
        fitbit_access_token: fitbit_token,
      };

      // Save preferences to local storage
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));

      const requestBody = {
        sessionId: storedSessionId,
        ...preferences,
      };

      console.log(requestBody);

      const response = await fetch(
        'https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/add_user_preferences',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseData = await response.json();
      console.log(responseData);

      if (!response.ok) {
        console.log(responseData);
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.warn('Error saving preferences:', error);
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.label}>{questions[step].label}</Text>
        {questions[step].input}
        <View style={styles.buttonRow}>
          {step > 0 && (
            <Button
              mode="outlined"
              onPress={() => setStep(step - 1)}
              style={styles.backButton}
              labelStyle={styles.backButtonLabel}
              textColor="#fff"
            >
              Back
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
            labelStyle={styles.nextButtonLabel}
          >            
          {step === questions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#09253F',
    width: '100%',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#09253F',
    minHeight: '100%',
  },
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#243a52',
    overflow: 'hidden',
    marginBottom: 30,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#645BFF',
  },
  label: {
    fontSize: 17,
    color: '#ceced6',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#243a52',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#FFFFFF',
    paddingLeft: 18,
  },
  pickerButton: {
    backgroundColor: '#243a52',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 15,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerWrapper: {
    backgroundColor: '#243a52',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  picker: {
    color: '#FFFFFF',
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: '#645BFF',
    borderRadius: 10,
    padding: 16,
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#00B0B9',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 30,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginHorizontal: -5,
  },
  yesNoButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#243a52',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#645BFF',
    borderColor: '#645BFF',
  },
  yesNoText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  backButton: {
    flex: 1,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#645BFF',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
  },
  nextButtonLabel: {
    fontSize: 16,
  },
  backButtonLabel: {
    fontSize: 16,
  },
});
