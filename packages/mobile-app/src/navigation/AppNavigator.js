import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

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
import BillingScreen from "../screens/shared/BillingScreen";
import ComplaintDetail from "../screens/shared/ComplaintDetail";
import NewsDetailScreen from "../screens/shared/NewsDetailScreen";
import NotificationDetail from "../screens/shared/NotificationDetail";

// ── Worker Screens ────────────────────────────────────────────────
import WorkerDashboard from "../screens/worker/WorkerDashboard";
import AssignedComplaints from "../screens/worker/AssignedComplaints";
import NotificationScreen from "../screens/shared/NotificationScreen";

// ── Admin Screens ─────────────────────────────────────────────────
import AdminDashboard from "../screens/admin/AdminDashboard";
import AdminComplaints from "../screens/admin/AdminComplaints";
import AdminWorkers from "../screens/admin/AdminWorkers";
import AdminNotifications from "../screens/admin/AdminNotifications";
import ComplaintDetailAdmin from "../screens/admin/ComplaintDetailAdmin";

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
          Notifications: "bell",
          News: "newspaper",
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
    <Tab.Screen name="Notifications" component={NotificationScreen} />
    <Tab.Screen name="News" component={NewsScreen} />
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
          Notifications: "bell",
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
    <Tab.Screen name="Notifications" component={NotificationScreen} />
    <Tab.Screen name="News" component={NewsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ── Admin Bottom Tabs ─────────────────────────────────────────────
const AdminTabs = () => (
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
          Complaints: "clipboard-list",
          Notifications: "bell",
          Workers: "account-multiple",
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
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Complaints" component={AdminComplaints} />
    <Tab.Screen name="Notifications" component={AdminNotifications} />
    <Tab.Screen name="Workers" component={AdminWorkers} />
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
      ) : userInfo.role === "public" || userInfo.role === "citizen" ? (
        // ── Public stack ──
        <>
          <Stack.Screen name="PublicTabs" component={PublicTabs} />
          <Stack.Screen name="AddComplaint" component={AddComplaintScreen} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetail} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
          <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          <Stack.Screen name="Exam" component={ExamScreen} />
          <Stack.Screen name="Camps" component={CampsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Billing" component={BillingScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      ) : userInfo.role === "admin" || userInfo.role === "superadmin" ? (
        // ── Admin stack ──
        <>
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
          <Stack.Screen name="AdminComplaints" component={AdminComplaints} />
          <Stack.Screen name="AdminWorkers" component={AdminWorkers} />
          <Stack.Screen name="AdminNotifications" component={AdminNotifications} />
          <Stack.Screen name="ComplaintDetailAdmin" component={ComplaintDetailAdmin} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
          <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Billing" component={BillingScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      ) : (
        // ── Worker stack ──
        <>
          <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetail} />
          <Stack.Screen name="NotificationDetail" component={NotificationDetail} />
          <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Billing" component={BillingScreen} />
          <Stack.Screen name="Verify" component={VerifyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
