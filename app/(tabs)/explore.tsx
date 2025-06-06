import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { Modal, StyleSheet, Text, View, ScrollView, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import FiltersBar from '../components/FiltersBar';
import { supabase } from '../supabaseClient';
import ExpandedDishCard from '../components/ExpandedDishCard';


export default function ExploreScreen() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: 40 }} />
      <FiltersBar />
      <View style={{ flex: 1 }}>
        <View style={{ height: 12 }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {dishes.map((dish, idx) => (
              <TouchableWithoutFeedback key={dish.id || idx} onPress={() => setSelectedDish(dish)}>
                <View style={{ width: '48%', marginBottom: 18 }}>
                  <View
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
                  </View>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>
        </ScrollView>
        <Modal
          visible={!!selectedDish}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setSelectedDish(null)}
        >
          {selectedDish && (
            <ExpandedDishCard dish={selectedDish} onClose={() => setSelectedDish(null)} />
          )}
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
});
