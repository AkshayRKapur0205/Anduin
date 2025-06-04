import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#A1CEDC',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            height: 60,
          },
        }),
        tabBarIcon: ({ color, size, focused }) => {
          switch (route.name) {
            case 'index':
              return <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />;
            case 'explore':
              return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
            case 'import':
              return <Ionicons name={focused ? 'add' : 'add-outline'} size={size} color={color} />;
            case 'community':
              return <MaterialCommunityIcons name={focused ? 'account-group' : 'account-group-outline'} size={size} color={color} />;
            case 'account':
              return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
            default:
              return null;
          }
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'Explore' }} />
      <Tabs.Screen name="explore" options={{ title: 'Home' }} />
      <Tabs.Screen name="import" options={{ title: 'Create' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
