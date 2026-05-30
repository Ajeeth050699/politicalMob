import React, { useEffect,useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { T } from './constants/theme';
// import * as SplashScreen from 'expo-splash-screen';
import * as ExpoSplash from 'expo-splash-screen';
import SplashScreen from './screens/auth/SplashScreen';
import { LanguageProvider } from './context/LanguageContext';
// SplashScreen.preventAutoHideAsync();

// export default function App() {

//   useEffect(() => {
//     setTimeout(async () => {
//       await SplashScreen.hideAsync();
//     }, 3000);
//   }, []);
ExpoSplash.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    // Hide the native expo splash immediately
    // Our custom animated splash takes over
    ExpoSplash.hideAsync().catch(() => {});
  }, []);

  // While custom splash is showing, render it fullscreen
  if (showCustomSplash) {
    return (
      <SplashScreen onFinish={() => setShowCustomSplash(false)} />
    );
  }

  return (
   <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <StatusBar backgroundColor={T.maroon} barStyle="light-content" />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <Toast />
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

