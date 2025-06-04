import React from 'react';
import { View, ScrollView, Image, Text, TouchableWithoutFeedback } from 'react-native';
import DishDetails from './DishDetails';

interface ExpandedDishCardProps {
  dish: {
    image: any;
    title: string;
    likes: number;
    ingredients: string[];
    directions: string;
    notes?: string;
  };
  onClose: () => void;
}

export default function ExpandedDishCard({ dish, onClose }: ExpandedDishCardProps) {
  return (
    <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 0 }}>
      <View style={{ width: '100%', aspectRatio: 1.2 }}>
        <Image source={dish.image} style={{ width: '100%', height: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'flex-start', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' }} pointerEvents="none">
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>{dish.title}</Text>
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, marginBottom: 12 }}>{dish.likes} Likes</Text>
        </View>
      </View>
      <DishDetails ingredients={dish.ingredients} directions={dish.directions} notes={dish.notes} />
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ position: 'absolute', top: 64, right: 20, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 4 }}>
          <Text style={{ color: '#A1CEDC', fontSize: 28, fontWeight: 'bold' }}>✕</Text>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
