import React from 'react';
import { Text, View } from 'react-native';

interface DishDetailsProps {
  notes?: string;
  ingredients: any[] | string;
  directions: string[] | string;
  rating?: number;
}

export default function DishDetails({ notes = 'No notes yet.', ingredients, directions, rating }: DishDetailsProps) {
  // Helper to parse ingredients as array of objects or strings
  const parseIngredients = (ingredients: any[] | string) => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string') {
      try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return ingredients
          .replace(/\[|\]|'/g, '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  };
  // Helper to parse directions
  const parseDirections = (directions: any[] | string) => {
    if (Array.isArray(directions)) return directions;
    if (typeof directions === 'string') return directions.split('\n');
    return [];
  };
  const parsedIngredients = parseIngredients(ingredients);
  const parsedDirections = parseDirections(directions);
  return (
    <View style={{ minHeight: '100%', backgroundColor: '#222', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginTop: 0, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40, flex: 1 }}>
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Notes</Text>
      <Text style={{ color: '#fff', fontSize: 17, marginBottom: 12 }}>{notes}</Text>
      {typeof rating === 'number' && !isNaN(rating) && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 8, marginBottom: 4 }}>Rating</Text>
          <Text style={{ color: '#fff', fontSize: 18 }}>{rating.toFixed(1)} / 10</Text>
        </View>
      )}
      {/* Tags section (always visible if tags exist) */}
      {Array.isArray((ingredients as any)?.tags) && (ingredients as any).tags.length > 0 && (
        <View style={{ minHeight: 40, marginTop: 0, paddingTop: 16, paddingBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 8, marginBottom: 4 }}>Tags</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {(ingredients as any).tags.map((tag: string, idx: number) => (
              <Text key={tag + idx} style={{ color: '#fff', fontSize: 17, marginBottom: 2, marginLeft: 8 }}>- {tag}</Text>
            ))}
          </View>
        </View>
      )}
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Ingredients</Text>
      <View style={{ marginBottom: 16 }}>
        {parsedIngredients.map((item: any, idx: number) => {
          // Extract parentheses content as note/alternatives
          let name = typeof item === 'object' && item !== null ? item.name : item;
          let note = '';
          if (typeof name === 'string') {
            const match = name.match(/^(.*?)(\s*\(([^)]+)\))?$/);
            if (match) {
              name = match[1].trim();
              note = match[3] ? match[3].trim() : '';
            }
          }
          // Clean up note: remove leading/trailing commas and spaces
          if (typeof note === 'string') {
            note = note.replace(/^,\s*/, '').replace(/^\s+/, '').replace(/\s+$/, '');
          }
          if (typeof item === 'object' && item !== null) {
            return (
              <View key={idx} style={{ marginBottom: 6, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ color: '#A1CEDC', fontWeight: 'bold', fontSize: 17 }}>
                    {item.amount ? item.amount : ''}{item.unit ? ` ${item.unit}` : ''}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 17, flex: 1, marginLeft: 8 }}>{name}</Text>
                </View>
                {note !== '' && (
                  <Text style={{ color: '#888', fontSize: 15, marginLeft: 8, marginTop: 2, fontStyle: 'italic' }}>Note/alternatives: {note}</Text>
                )}
              </View>
            );
          } else {
            // For string ingredients
            return (
              <View key={idx} style={{ marginBottom: 6, marginLeft: 8 }}>
                <Text style={{ color: '#fff', fontSize: 17 }}>- {name}</Text>
                {note !== '' && (
                  <Text style={{ color: '#888', fontSize: 15, marginLeft: 8, marginTop: 2, fontStyle: 'italic' }}>Note/alternatives: {note}</Text>
                )}
              </View>
            );
          }
        })}
      </View>
      <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Directions</Text>
      <View style={{ marginBottom: 16 }}>
        {parsedDirections.map((step: string, idx: number) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, marginLeft: 8 }}>
            <Text style={{ color: '#A1CEDC', fontWeight: 'bold', fontSize: 17 }}>{idx + 1}.</Text>
            <Text style={{ color: '#fff', fontSize: 17, flex: 1, marginLeft: 8 }}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
