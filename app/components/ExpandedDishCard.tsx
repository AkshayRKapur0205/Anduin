import { Image as ExpoImage } from 'expo-image';
import React, { useRef, useState } from 'react';
import { PanResponder, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import DishDetails from './DishDetails';
import RecipeForm from './RecipeForm';

interface ExpandedDishCardProps {
  dish: {
    id?: string;
    image: any;
    title: string;
    likes: number;
    ingredients: string[];
    directions: string;
    notes?: string;
    tags?: string[];
    privacy?: string;
    rating?: number; // Add rating to dish type
  };
  onClose: () => void;
  onSaveEdit?: (updatedDish: any) => void; // Optional callback for saving edits
  editable?: boolean; // If true, show Edit button and allow editing
}

export default function ExpandedDishCard({ dish, onClose, onSaveEdit, editable }: ExpandedDishCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(dish);
  const recipeFormRef = useRef<any>(null);

  // Track scroll position for swipe-to-close
  const scrollRef = React.useRef<ScrollView>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const startY = React.useRef<number | null>(null);

  // PanResponder for swipe down to close
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only allow swipe-to-close if scroll is at the very top
        return gestureState.dy > 4 && gestureState.vy > 0.07 && gestureState.moveY > 0 && gestureState.y0 > 0 && scrollY.current <= 2;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsSwiping(false);
        if (gestureState.dy > 24 && gestureState.vy > 0.15 && scrollY.current <= 2) {
          onClose();
        }
      },
      onPanResponderTerminate: () => setIsSwiping(false),
    })
  ).current;

  // Track scroll position
  const scrollY = React.useRef(0);

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

  // Save handler for RecipeForm
  const handleSave = async (data: any) => {
    setIsEditing(false);
    setEditData(data);
    if (onSaveEdit) {
      await onSaveEdit({ ...dish, ...data });
    }
  };

  // Only allow editing if editable prop is true
  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{ padding: 0 }}
      scrollEventThrottle={16}
      onScroll={e => {
        scrollY.current = e.nativeEvent.contentOffset.y;
      }}
      {...panResponder.panHandlers}
    >
      <View style={{ width: '100%', aspectRatio: 1.2, backgroundColor: '#222' }}>
        <ExpoImage
          source={getImageSource(isEditing ? editData.image : dish.image)}
          style={{ width: '100%', height: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          contentFit="cover"
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', alignItems: 'flex-start', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' }} pointerEvents="none">
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 }}>{isEditing ? editData.title : dish.title}</Text>
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, marginBottom: 4 }}>{isEditing ? editData.likes : dish.likes} Likes</Text>
          {/* Show decimal rating under likes if present, or show N/A if not present */}
          {((isEditing ? editData.rating : dish.rating) !== undefined && (isEditing ? editData.rating : dish.rating) !== null && !isNaN(Number(isEditing ? editData.rating : dish.rating))) ? (
            <Text style={{ fontSize: 17, color: '#A1CEDC', fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, marginBottom: 12 }}>
              Rating: {parseFloat(isEditing ? editData.rating : dish.rating).toFixed(1)} / 10
            </Text>
          ) : (
            <Text style={{ fontSize: 17, color: '#A1CEDC', fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, marginBottom: 12 }}>
              Rating: N/A
            </Text>
          )}
        </View>
        {/* Edit button (top left) if editable and not editing */}
        {editable && !isEditing && (
          <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
            <View style={{ position: 'absolute', top: 64, left: 20, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 32, padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8 }}>
              <Text style={{ color: '#A1CEDC', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>✎</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
        {/* Save button (top left) if editing */}
        {editable && isEditing && (
          <TouchableWithoutFeedback onPress={() => {
            if (recipeFormRef.current && typeof recipeFormRef.current.submit === 'function') {
              recipeFormRef.current.submit();
            }
          }}>
            <View style={{ position: 'absolute', top: 64, left: 20, zIndex: 1000, backgroundColor: 'rgba(34,197,94,0.85)', borderRadius: 32, padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>✔</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
      {/* If editing, show RecipeForm with initial values */}
      {isEditing ? (
        <RecipeForm
          ref={recipeFormRef}
          onSubmit={handleSave}
          initialValues={editData}
          editMode={true}
        />
      ) : (
        <>
          {/* Pass ingredients as objects to DishDetails for correct display */}
          <DishDetails ingredients={dish.ingredients} directions={dish.directions} notes={dish.notes} rating={dish.rating} />
          {/* Tags section (always visible if tags exist) */}
          {dish.tags && Array.isArray(dish.tags) && dish.tags.length > 0 && (
            <View style={{ minHeight: 60, marginTop: 0, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 40 }}>
              <Text style={{ fontWeight: 'bold', color: '#A1CEDC', fontSize: 22, marginTop: 16, marginBottom: 4 }}>Tags</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                {dish.tags.map((tag: string, idx: number) => (
                  <Text key={tag + idx} style={{ color: '#fff', fontSize: 17, marginBottom: 2, marginLeft: 8 }}>- {tag}</Text>
                ))}
              </View>
            </View>
          )}
        </>
      )}
      {/* Close button (top right) always visible */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ position: 'absolute', top: 64, right: 20, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 32, padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8 }}>
          <Text style={{ color: '#A1CEDC', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>✕</Text>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}
