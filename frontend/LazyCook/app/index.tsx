import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidations, setPasswordValidations] = useState({
    isLongEnough: false,
    hasUpperLower: false,
    hasDigit: false,
    hasSpecialChar: false,
  });
  
  const formHeight = useSharedValue(300);
  
  const formStyle = useAnimatedStyle(() => {
    return {
      height: formHeight.value,
    };
  });
  
  const toggleAuthMode = () => {
    Keyboard.dismiss();
    formHeight.value = withSpring(isLogin ? 430 : 300, {
      damping: 15,
      stiffness: 100,
    });
    setIsLogin(!isLogin);
  };

  const validateEmail = (email : string) => {
    const emailRequirements = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRequirements.test(email);
  };
  
  const validateName = (name : string) => {
    return name.trim().length > 1;
  };

  const validatePassword = (password : string) => {
    setPassword(password);
    setPasswordValidations({
      isLongEnough: password.length >= 8,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasDigit: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleSubmit = async () => {
    //router.push('/home'); 
    if (!validateEmail(email)) {
      Alert.alert("Invalid email", "Please enter a valid email");
      return;
    }
    if (!isLogin && !validateName(name)) {
      Alert.alert("Invalid Name", "Please enter a valid name");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }
    if (!isLogin && !Object.values(passwordValidations).every(Boolean)) { 
      Alert.alert("Invalid Password", "Password does not meet requirements");
      return;
    }
    const url = isLogin 
      ? 'https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/login' 
      : 'https://1ckhyldni3.execute-api.eu-west-1.amazonaws.com/dev/register';

    
    const requestBody = {
      username: email,
      password: password,
      name: name,
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody), // Send form-encoded data
      });

      console.log('Response:', response);

      const data = await response.json();

      //store session id 
      const sessionId = data.session_id;
      if (sessionId != null){
        console.log('Session ID received')
        AsyncStorage.setItem("sessionId", sessionId)
      }
      else{
        console.log('Error: No session ID provided')
      }

      if (response.ok) {
        console.log(data.message);  
        router.push('/home');  
      } else {
        console.log('Error:', data.message);  
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
      >
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Sign in or create an account to continue
          </Text>
        </View>

        <Animated.View style={[styles.form, formStyle]}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#8E8E93"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor="#8E8E93"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </>
          )}    
          
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={validatePassword}
            secureTextEntry
          />

          {!isLogin && !Object.values(passwordValidations).every(Boolean) && (
            <View>
              <Text style={{ color: passwordValidations.isLongEnough ? 'green' : 'red', fontSize: 12, marginBottom: 5 }}>
                • Password must be at least 8 characters and contain:
              </Text>
              <Text style={{ color: passwordValidations.hasUpperLower ? 'green' : 'red', fontSize: 12, marginBottom: 5 }}>
                • At least one uppercase and one lowercase letter
              </Text>
              <Text style={{ color: passwordValidations.hasDigit ? 'green' : 'red', fontSize: 12, marginBottom: 5 }}>
                • At least one digit (i.e. 0-9)
              </Text>
              <Text style={{ color: passwordValidations.hasSpecialChar ? 'green' : 'red', fontSize: 12, marginBottom: 5 }}>
                • At least one special character
              </Text>
            </View>
          )}

          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Confirm password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#8E8E93"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          )}
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {isLogin ? 'Login' : 'Create account'}
            </Text>
          </TouchableOpacity>

          <View style={[
            styles.bottomContainer, 
            !isLogin && { justifyContent: 'center' }
          ]}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={toggleAuthMode}
            >
              <Text style={styles.toggleButtonText}>
                {isLogin ? 'Create an account' : 'Already have an account?'}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09253F',
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: '-19%',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 17,
    color: '#ceced6',
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
  },
  form: {
    width: '95%',
    marginTop: 5,
    alignSelf: 'center',
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
  submitButton: {
    backgroundColor: '#645BFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  toggleButton: {
    padding: 0,
  },
  toggleButtonText: {
    color: '#5856D6',
    fontSize: 17,
    fontWeight: '500',
    marginTop: 3,
  },
  forgotPasswordButton: {
    padding: 0,
  },
  forgotPasswordText: {
    color: '#5856D6',
    fontSize: 17,
    fontWeight: '500',
    marginTop: 3,
  },
});
