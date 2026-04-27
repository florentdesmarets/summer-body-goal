import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as RNStatusBar } from 'react-native';
import { colors } from './src/theme';
import PWAInstallBanner from './src/components/PWAInstallBanner';

import MealsScreen from './src/screens/Meals/MealsScreen';
import RecipeScreen from './src/screens/Recipe/RecipeScreen';
import ShoppingScreen from './src/screens/Shopping/ShoppingScreen';
import CuisineScreen from './src/screens/Cuisine/CuisineScreen';
import SportScreen from './src/screens/Sport/SportScreen';
import ProgressScreen from './src/screens/Progress/ProgressScreen';
import WorkoutLogScreen from './src/screens/Sport/WorkoutLogScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Recipe: { recipeId: string };
  WorkoutLog: { workoutPlanId?: string; date: string };
};

export type BottomTabParamList = {
  Repas: undefined;
  Courses: undefined;
  Cuisine: undefined;
  Sport: undefined;
  Progression: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function BottomTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPad,
          height: 56 + bottomPad,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Repas') iconName = focused ? 'restaurant' : 'restaurant-outline';
          if (route.name === 'Courses') iconName = focused ? 'cart' : 'cart-outline';
          if (route.name === 'Cuisine') iconName = focused ? 'flame' : 'flame-outline';
          if (route.name === 'Sport') iconName = focused ? 'footsteps' : 'footsteps-outline';
          if (route.name === 'Progression') iconName = focused ? 'trending-up' : 'trending-up-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Repas" component={MealsScreen} />
      <Tab.Screen name="Courses" component={ShoppingScreen} />
      <Tab.Screen name="Cuisine" component={CuisineScreen} />
      <Tab.Screen name="Sport" component={SportScreen} />
      <Tab.Screen name="Progression" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <PWAInstallBanner />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="Recipe" component={RecipeScreen} />
          <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
