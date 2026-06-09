import React, { useEffect,useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from './services/api';
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
  const [debug, setDebug] = useState(false);


  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log('[App] start system check');
    const checkSystem = async () => {
      try {

        let isDev = false;
        try {
          const raw = await AsyncStorage.getItem('userInfo');
          if (raw) {
            const u = JSON.parse(raw);
            if (u && u.role === 'developer') isDev = true;
          }
        } catch(e) {}
        if (isDev) {
          console.log('[App] isDev bypass => skip maintenance');
          setChecking(false);
          return;
        }

        const { data } = await axios.get(BASE_URL + '/api/system/public-settings');
        if (data && data.maintenanceMode && data.maintenanceMode.mobileApp) {
          setMaintenance(true);
          setMaintenanceMsg(data.maintenanceMode.message || "System is under maintenance. Please try again later.");
        }
      } catch (err) {
        console.log('[App] system check error', err?.message || err);
      } finally {
        console.log('[App] system check finished');
        setChecking(false);
      }

    };
    checkSystem();
  }, []);

  useEffect(() => {
    // Hide the native expo splash immediately
    // Our custom animated splash takes over
    ExpoSplash.hideAsync().catch(() => {});
  }, []);

  if (checking) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={T.maroon} /></View>;
  }

  if (maintenance) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>??</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: T.maroon, marginBottom: 10 }}>Under Maintenance</Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 }}>{maintenanceMsg}</Text>
        <TouchableOpacity onPress={() => setMaintenance(false)}>
           <Text style={{ color: T.maroon, fontSize: 14 }}>Developer Bypass</Text>
        </TouchableOpacity>
      </View>
    );
  }




  // While custom splash is showing, render it fullscreen
  if (showCustomSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          console.log('[App] custom splash finished');
          setShowCustomSplash(false);
        }}
      />
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

