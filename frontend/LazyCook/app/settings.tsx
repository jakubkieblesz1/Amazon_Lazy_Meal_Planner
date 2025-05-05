import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';

// Move PreferencesForm outside and memoize it
const PreferencesForm = React.memo(({ 
  diet, setDiet,
  budget, setBudget,
  cuisines, setCuisines,
  allergens, setAllergens,
  kitchenEquipment, setKitchenEquipment,
  numberOfPeople, setNumberOfPeople,
  notifications, setNotifications,
  setIsPickerVisible,
  handleSave,
  isSaving
}) => {
  const handleFitbitConnect = async () => {
    const clientId = '23QC6W';
    const responseType = 'token';
    const scope = 'activity nutrition weight profile'; 
    const redirectUrl = 'https://mchugha2.github.io/'; 

    const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
      `response_type=${responseType}` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}` + // Ensure redirectUrl is also encoded
      `&scope=${encodeURIComponent(scope)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl);
    console.log(result);
  };

  return (
    <View style={styles.formInnerContainer}>
      <Text style={styles.label}>Dietary Requirements</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Vegan, Vegetarian, Keto"
        placeholderTextColor="#8E8E93"
        value={diet}
        onChangeText={setDiet}
      />

      <Text style={styles.label}>Weekly Budget</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. €50, €100, €200"
        placeholderTextColor="#8E8E93"
        value={budget}
        onChangeText={setBudget}
      />

      <Text style={styles.label}>Preferred Cuisines</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Italian, Asian, Mexican"
        placeholderTextColor="#8E8E93"
        value={cuisines}
        onChangeText={setCuisines}
      />

      <Text style={styles.label}>Food Allergens</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Nuts, Dairy, Gluten"
        placeholderTextColor="#8E8E93"
        value={allergens}
        onChangeText={setAllergens}
      />

      <Text style={styles.label}>Kitchen Equipment</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Oven, Air Fryer, Blender"
        placeholderTextColor="#8E8E93"
        value={kitchenEquipment}
        onChangeText={setKitchenEquipment}
      />

      <Text style={styles.label}>Number of People</Text>
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setIsPickerVisible(true)}
      >
        <Text style={styles.pickerButtonText}>{numberOfPeople}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Notifications</Text>
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

      <TouchableOpacity 
        style={styles.connectButton}
        onPress={handleFitbitConnect}
      >
        <Text style={styles.connectButtonText}>Connect to Fitbit</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSave}
      >
        <Text style={styles.submitButtonText}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export default function SettingsScreen() {
  const [diet, setDiet] = useState('');
  const [budget, setBudget] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [allergens, setAllergens] = useState('');
  const [kitchenEquipment, setKitchenEquipment] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [notifications, setNotifications] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem('userPreferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        setDiet(parsed.diet || 'n/a');
        setBudget(parsed.budget || 'n/a');
        setCuisines(parsed.cuisines || 'n/a');
        setAllergens(parsed.allergens || 'n/a');
        setKitchenEquipment(parsed.kitchen_equipment || 'n/a');
        setNumberOfPeople(parsed.number_of_people || '1');
        setNotifications(parsed.notification_options || false);
      }
    } catch (error) {
      console.warn('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const storedSessionId = await AsyncStorage.getItem("sessionId");
      
      const preferences = {
        diet,
        budget,
        cuisines,
        allergens,
        kitchen_equipment: kitchenEquipment,
        number_of_people: numberOfPeople,
        notification_options: notifications.toString(),
      };

      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));

      const requestBody = {
        sessionId: storedSessionId,
        ...preferences,
      };

      console.log(requestBody);

      const fetchPromise = fetch(
        'https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/add_user_preferences',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const response = await Promise.race([fetchPromise]) as Response;

      const responseData = await response.json();

      console.log(responseData);

      if (!response.ok) {
        console.log(responseData);
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.warn('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.upperContainer}>
        <Text style={styles.title}>Your settings</Text>
        <Text style={styles.subtitle}>Dial in your preferences</Text>
      </View>
      
      <ScrollView 
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <PreferencesForm 
          diet={diet}
          setDiet={setDiet}
          budget={budget}
          setBudget={setBudget}
          cuisines={cuisines}
          setCuisines={setCuisines}
          allergens={allergens}
          setAllergens={setAllergens}
          kitchenEquipment={kitchenEquipment}
          setKitchenEquipment={setKitchenEquipment}
          numberOfPeople={numberOfPeople}
          setNumberOfPeople={setNumberOfPeople}
          notifications={notifications}
          setNotifications={setNotifications}
          setIsPickerVisible={setIsPickerVisible}
          handleSave={handleSave}
          isSaving={isSaving}
        />
      </ScrollView>

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
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => setIsPickerVisible(false)}
            >
              <Text style={styles.submitButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => router.push('/home')}
        >
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
        <TouchableOpacity style={styles.navButton}>
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
    flex: 0,
    backgroundColor: '#09253F',
    paddingHorizontal: 30,
    marginTop: -20,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#09253F',
    marginTop: 20,
  },
  formInnerContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
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
    height: undefined,
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
  submitButton: {
    backgroundColor: '#645BFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: '#645BFF',
    borderRadius: 10,
    padding: 16,
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
    color: '#fff',
    fontWeight: '600',
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
}); 