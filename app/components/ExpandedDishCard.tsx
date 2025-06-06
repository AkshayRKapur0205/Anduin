import React from 'react';
import { View, ScrollView, Text, TouchableWithoutFeedback } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import DishDetails from './DishDetails';

interface ExpandedDishCardProps {
  dish: {
    image: any;
    title: string;
    likes: number;
    ingredients: string[];
    directions: string;
    notes?: string;
    tags?: string[];
  };
  onClose: () => void;
}

export default function ExpandedDishCard({ dish, onClose }: ExpandedDishCardProps) {
  // Helper to resolve image source for both local and remote
  const getImageSource = (img: any) => {
    if (!img) return require('@/assets/images/react-logo.png');
    if (typeof img === 'string') {
      if (img.startsWith('file://') || img.startsWith('content://')) {
        return { uri: img };
      }
      if (img.startsWith('http')) {
        return { uri: img };
      }
    }
    return img;
  };
  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 0 }}>
      <View style={{ width: '100%', aspectRatio: 1.2, backgroundColor: '#222' }}>
        <ExpoImage
          source={getImageSource(dish.image)}
          style={{ width: '100%', height: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          contentFit="cover"
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'flex-start', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' }} pointerEvents="none">
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>{dish.title}</Text>
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, marginBottom: 12 }}>{dish.likes} Likes</Text>
        </View>
      </View>
      <DishDetails ingredients={dish.ingredients} directions={dish.directions} notes={dish.notes} />
      {/* Filters section */}
      {dish.tags && Array.isArray(dish.tags) && dish.tags.length > 0 && (
        <View style={{ minHeight: 60, marginTop: 0, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40 }}>
          <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Filters</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {dish.tags.map((tag: string, idx: number) => (
              <Text key={tag + idx} style={{ color: '#fff', fontSize: 17, marginBottom: 2, marginLeft: 8 }}>- {tag}</Text>
            ))}
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ position: 'absolute', top: 64, right: 20, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 32, padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8 }}>
          <Text style={{ color: '#A1CEDC', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>✕</Text>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
