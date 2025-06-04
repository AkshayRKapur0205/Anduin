import React from 'react';
import { View, Text } from 'react-native';

interface DishDetailsProps {
  notes?: string;
  ingredients: string[] | string;
  directions: string;
}

export default function DishDetails({ notes = 'No notes yet.', ingredients, directions }: DishDetailsProps) {
  // Helper to parse ingredients string or array
  const parseIngredients = (ingredients: string[] | string) => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string') {
      // Try to parse stringified array
      try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Not a JSON array, fallback to comma split
        return ingredients
          .replace(/\[|\]|'/g, '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  return (
    <View style={{ minHeight: 260, backgroundColor: '#222', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginTop: 0, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40 }}>
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Notes</Text>
      <Text style={{ color: '#fff', fontSize: 17, marginBottom: 12 }}>{notes}</Text>
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Ingredients</Text>
      <View style={{ marginBottom: 16 }}>
        {parseIngredients(ingredients).map((item, idx) => (
          <Text key={idx} style={{ color: '#fff', fontSize: 17, marginBottom: 2, marginLeft: 8 }}>- {item}</Text>
        ))}
      </View>
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Directions</Text>
      <Text style={{ color: '#fff', fontSize: 17, marginBottom: 2, marginLeft: 8 }}>{directions}</Text>
    </View>
  );
}
