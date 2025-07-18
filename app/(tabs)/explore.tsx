import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import ExpandedDishCard from '../components/ExpandedDishCard';
import FiltersBar from '../components/FiltersBar';


export default function ExploreScreen() {
  const colorScheme = useColorScheme && useColorScheme() || 'light';
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleLongPress = () => setEditMode(true);
  const shakeAnim = React.useRef(new Animated.Value(0)).current;
  const doneAnim = React.useRef(new Animated.Value(0)).current;

  const startShake = () => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ])
  ).start();
};

useEffect(() => {
  if (editMode) {
    doneAnim.setValue(0.7);
    Animated.spring(doneAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  } else {
    Animated.timing(shakeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).stop();
    doneAnim.setValue(0);
  }
}, [editMode]);

  // Helper to reload only private recipes from AsyncStorage
  const reloadDishes = async () => {
    let privateDishes: any[] = [];
    try {
      const local = await AsyncStorage.getItem('privateRecipes');
      privateDishes = local ? JSON.parse(local) : [];
    } catch (e) {
      privateDishes = [];
    }
    setDishes(privateDishes);
  };

  useEffect(() => {
    reloadDishes();
    // No Supabase subscription needed for private recipes
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(res => setTimeout(res, 1000)); // Always show spinner for at least 1s
    await reloadDishes();
    setRefreshing(false);
  };

  // Filter dishes by search query and selected filters (must match ALL selected filters in tags)
  const filteredDishes = dishes.filter(dish => {
    // Search filter
    const matchesSearch = dish.title && dish.title.toLowerCase().includes(search.trim().toLowerCase());
    // Filters: all selectedFilters must be present in dish.tags
    const matchesFilters = selectedFilters.length === 0 ||
      (Array.isArray(dish.tags) && selectedFilters.every(f => dish.tags.includes(f)));
    return matchesSearch && matchesFilters;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }}>
      <View style={{ height: 40 }} />
      <FiltersBar onFiltersChange={setSelectedFilters} />
      {/* Search bar under filter bar */}
      <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 18 }}>
        <View style={{
          backgroundColor: colorScheme === 'dark' ? '#23272F' : '#f2f2f2',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          height: 40,
        }}>
          {/* Use a mapped icon name from IconSymbol, e.g., 'chevron.right' or 'house.fill' */}
          <IconSymbol name="chevron.right" color={colorScheme === 'dark' ? '#fff' : '#222'} size={20} style={{ marginRight: 8 }} />
          <Text
            style={{ color: colorScheme === 'dark' ? '#fff' : '#222', fontSize: 16, marginRight: 8 }}
          >
            Search:
          </Text>
          <Pressable style={{ flex: 1 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes..."
              placeholderTextColor={colorScheme === 'dark' ? '#bbb' : '#888'}
              style={{ flex: 1, fontSize: 16, color: colorScheme === 'dark' ? '#fff' : '#222', paddingVertical: 0 }}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Done button: appears between header/filters and the ScrollView, not over dishes */}
        {editMode && (
          <Animated.View
            style={{
              alignSelf: 'flex-end',
              marginTop: 8,
              marginRight: 18,
              marginBottom: 16,
              zIndex: 10,
              opacity: doneAnim,
              transform: [{ scale: doneAnim }],
            }}
            pointerEvents="auto"
          >
            <Pressable
              onPress={() => setEditMode(false)}
              style={{
                backgroundColor: '#222',
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 18,
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </Pressable>
          </Animated.View>
        )}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F8EF7" colors={["#4F8EF7"]} />
          }
          // No pointerEvents override, allow normal touch inside scroll area
        >
          {refreshing && (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <ActivityIndicator size="large" color="#4F8EF7" />
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {filteredDishes.map((dish, idx) => {
              const shake = editMode
                ? shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] })
                : '0deg';
              return (
                <Pressable
                  key={dish.id || idx}
                  onLongPress={handleLongPress}
                  delayLongPress={400}
                  onPress={() => !editMode && setSelectedDish(dish)}
                  style={{ width: '48%', marginBottom: 18 }}
                >
                  <Animated.View
                    style={{
                      width: '100%',
                      aspectRatio: 0.95,
                      borderRadius: 18,
                      overflow: 'hidden',
                      backgroundColor: '#eee',
                      position: 'relative',
                      shadowColor: '#000',
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 2,
                      transform: [{ rotate: shake }],
                    }}
                  >
                    <Image
                      source={dish.image || require('@/assets/images/react-logo.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width: '100%',
                        padding: 10,
                        backgroundColor: 'rgba(0,0,0,0.32)',
                        borderBottomLeftRadius: 18,
                        borderBottomRightRadius: 18,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{dish.title}</Text>
                    </View>
                    {editMode && (
                      <Pressable
                        onPress={() => setConfirmDeleteId(dish.id)}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          zIndex: 10,
                          backgroundColor: 'rgba(255,0,0,0.85)',
                          borderRadius: 16,
                          width: 32,
                          height: 32,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOpacity: 0.15,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                        hitSlop={10}
                      >
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: -2 }}>−</Text>
                      </Pressable>
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <Modal
          visible={!!selectedDish}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedDish(null)}
        >
          {selectedDish && (
            <ExpandedDishCard
              dish={selectedDish}
              onClose={() => setSelectedDish(null)}
              editable={true}
              onSaveEdit={async (updatedDish) => {
                // Update the recipe in AsyncStorage
                try {
                  const existing = await AsyncStorage.getItem('privateRecipes');
                  let recipes = existing ? JSON.parse(existing) : [];
                  recipes = recipes.map((r: any) => (r.id === updatedDish.id ? { ...r, ...updatedDish } : r));
                  await AsyncStorage.setItem('privateRecipes', JSON.stringify(recipes));
                  setDishes(recipes);
                  setSelectedDish(updatedDish);
                } catch (e) {
                  // Optionally show error
                }
              }}
            />
          )}
        </Modal>
        {/* Confirm delete modal */}
        <Modal
          visible={!!confirmDeleteId}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmDeleteId(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, width: 300, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Are you sure you want to delete this recipe?</Text>
              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <Pressable
                  onPress={() => setConfirmDeleteId(null)}
                  style={{ paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 }}
                >
                  <Text style={{ fontSize: 16, color: '#333' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    // Delete the recipe
                    try {
                      const local = await AsyncStorage.getItem('privateRecipes');
                      let recipes = local ? JSON.parse(local) : [];
                      recipes = recipes.filter((r: any) => r.id !== confirmDeleteId);
                      await AsyncStorage.setItem('privateRecipes', JSON.stringify(recipes));
                      setDishes(recipes);
                    } catch (e) {}
                    setConfirmDeleteId(null);
                  }}
                  style={{ paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8, backgroundColor: '#e53935' }}
                >
                  <Text style={{ fontSize: 16, color: '#fff', fontWeight: 'bold' }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  // Add new style for FiltersBar and Filters label
  filtersBarDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  filtersLabelWhite: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 16,
    marginBottom: 4,
  },
});
