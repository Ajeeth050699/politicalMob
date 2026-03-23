import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAuth } from "../context/AuthContext";
import { T } from "../constants/theme";

// ── Auth Screens ──────────────────────────────────────────────────
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import VerifyScreen from "../screens/auth/VerifyScreen";

// ── Public Screens ────────────────────────────────────────────────
import HomeScreen from "../screens/public/HomeScreen";
import AddComplaintScreen from "../screens/public/AddComplaintScreen";
import MyComplaintsScreen from "../screens/public/MyComplaintsScreen";
import NewsScreen from "../screens/public/NewsScreen";
import EmergencyScreen from "../screens/public/EmergencyScreen";
import EducationScreen from "../screens/public/EducationScreen";
import ExamScreen from "../screens/public/ExamScreen";
import CampsScreen from "../screens/public/CampsScreen"; // ← added

// ── Shared Screens ────────────────────────────────────────────────
import ProfileScreen from "../screens/shared/ProfileScreen";
import ComplaintDetail from "../screens/shared/ComplaintDetail";

// ── Worker Screens ────────────────────────────────────────────────
import WorkerDashboard from "../screens/worker/WorkerDashboard";
import AssignedComplaints from "../screens/worker/AssignedComplaints";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Public Bottom Tabs ────────────────────────────────────────────
const PublicTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: T.maroon,
      tabBarInactiveTintColor: T.textM,
      tabBarStyle: {
        backgroundColor: T.bgCard,
        borderTopColor: T.border,
        paddingBottom: 4,
        height: 60,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Home: "home",
          Complaints: "clipboard-list",
          News: "newspaper",
          Education: "school",
          Emergency: "phone-alert",
        };
        return (
          <Icon
            name={icons[route.name] || "circle"}
            size={size}
            color={color}
          />
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Complaints" component={MyComplaintsScreen} />
    <Tab.Screen name="News" component={NewsScreen} />
    <Tab.Screen name="Education" component={EducationScreen} />
    <Tab.Screen name="Emergency" component={EmergencyScreen} />
  </Tab.Navigator>
);

// ── Worker Bottom Tabs ────────────────────────────────────────────
const WorkerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: T.maroon,
      tabBarInactiveTintColor: T.textM,
      tabBarStyle: {
        backgroundColor: T.bgCard,
        borderTopColor: T.border,
        paddingBottom: 4,
        height: 60,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Dashboard: "view-dashboard",
          Complaints: "clipboard-check",
          News: "newspaper",
          Profile: "account",
        };
        return (
          <Icon
            name={icons[route.name] || "circle"}
            size={size}
            color={color}
          />
        );
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={WorkerDashboard} />
    <Tab.Screen name="Complaints" component={AssignedComplaints} />
    <Tab.Screen name="News" component={NewsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ── Root Navigator ────────────────────────────────────────────────
export default function AppNavigator() {
  const { userInfo, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: T.bg,
        }}
      >
        <ActivityIndicator size="large" color={T.maroon} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      {!userInfo ? (
        // ── Auth stack ──
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      ) : userInfo.role === "public" ? (
        // ── Public stack ──
        <>
          <Stack.Screen name="PublicTabs" component={PublicTabs} />
          <Stack.Screen name="AddComplaint" component={AddComplaintScreen} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetail} />
          <Stack.Screen name="Exam" component={ExamScreen} />
          <Stack.Screen name="Camps" component={CampsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      ) : (
        // ── Worker stack ──
        <>
          <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetail} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
