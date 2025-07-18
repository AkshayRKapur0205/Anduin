import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Animated, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { supabase } from '../supabaseClient';
import ConfirmDialog from './ConfirmDialog';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeFormProps {
  onSubmit: (data: any) => void;
  initialValues?: any; // Add initialValues for edit mode
  editMode?: boolean;
  showClearButton?: boolean; // <-- Added prop type
}

const RECIPE_SCRAPER_URL = 'https://recipescraper-juts.onrender.com/scrape'; // <-- CHANGE THIS to your computer's local IP address

const RecipeForm = forwardRef<unknown, RecipeFormProps>(function RecipeForm({ onSubmit, initialValues, editMode, showClearButton }, ref) {
  const colorScheme = useColorScheme && useColorScheme() || 'light';
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    image: initialValues?.image || '',
    notes: initialValues?.notes || '',
  });
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [imageUri, setImageUri] = useState<string>(initialValues?.image || '');
  const [filterCategories, setFilterCategories] = useState<{ name: string; options: { label: string; value: string }[] }[]>([]);
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>(
    initialValues?.ingredients && Array.isArray(initialValues.ingredients)
      ? initialValues.ingredients.map((i: any) => {
          if (typeof i === 'string') {
            // Try to parse string into amount, unit, name
            const match = i.match(/^(\d+[\d\/.]*)?\s*([a-zA-Z]+)?\s*(.*)$/);
            return {
              amount: match && match[1] ? match[1].trim() : '',
              unit: match && match[2] ? match[2].trim() : '',
              name: match && match[3] ? match[3].trim() : i,
            };
          } else if (typeof i === 'object' && i !== null) {
            return {
              name: i.name || '',
              amount: i.amount || '',
              unit: i.unit || '',
            };
          } else {
            return { name: '', amount: '', unit: '' };
          }
        })
      : [{ name: '', amount: '', unit: '' }]
  );
  const [directionsList, setDirectionsList] = useState<string[]>(
    initialValues?.directions && Array.isArray(initialValues.directions)
      ? initialValues.directions
      : typeof initialValues?.directions === 'string' && initialValues?.directions
      ? initialValues.directions.split('\n')
      : ['']
  );
  const [privacy, setPrivacy] = useState<'private' | 'public'>(initialValues?.privacy === 'public' ? 'public' : 'private');
  const [showCreated, setShowCreated] = useState(false);
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [method, setMethod] = useState<'manual' | 'url' | 'camera'>('manual');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [rating, setRating] = useState<string>(
    initialValues?.rating === undefined || initialValues?.rating === null || isNaN(Number(initialValues?.rating))
      ? ''
      : String(initialValues.rating)
  );
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const fetchFilters = async () => {
      const { data, error } = await supabase.from('filters').select('*');
      if (error) {
        console.error('Error fetching filters:', error);
        return;
      }
      const grouped: Record<string, { label: string; value: string }[]> = {};
      data.forEach((row: { category: string; filter: string }) => {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push({ label: row.filter, value: row.filter.toLowerCase().replace(/\s+/g, '_') });
      });
      setFilterCategories(
        Object.entries(grouped).map(([name, options]) => ({ name, options }))
      );
    };
    fetchFilters();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTagToggle = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleChange = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  const handleIngredientChange = (idx: number, key: keyof Ingredient, value: string) => {
    setIngredientsList(list => {
      const newList = [...list];
      newList[idx][key] = value;
      return newList;
    });
  };
  const addIngredient = () => setIngredientsList(list => [...list, { name: '', amount: '', unit: '' }]);
  const removeIngredient = (idx: number) => setIngredientsList(list => list.length > 1 ? list.filter((_, i) => i !== idx) : list);
  const handleDirectionChange = (idx: number, value: string) => {
    setDirectionsList(list => {
      const newList = [...list];
      newList[idx] = value;
      return newList;
    });
  };
  const addDirection = () => setDirectionsList(list => [...list, '']);
  const removeDirection = (idx: number) => setDirectionsList(list => list.length > 1 ? list.filter((_, i) => i !== idx) : list);

  const handleUrlFetch = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const response = await fetch(`${RECIPE_SCRAPER_URL}?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (response.ok) {
        setForm(f => ({
          ...f,
          title: data.title || '',
          image: data.image || '',
          notes: `${data.notes || ''}${data.total_time ? `\nTotal time: ${data.total_time} min` : ''}${data.yields ? `\nYields: ${data.yields}` : ''}`.trim(),
        }));
        setImageUri(data.image || '');
        setIngredientsList(
          Array.isArray(data.ingredients)
            ? data.ingredients.map((i: string) => {
                const match = i.match(/^([\d.,/\s]+)?\s*([a-zA-Z%]+)?\s*(.*)$/);
                if (match) {
                  let amount = match[1]?.trim() || '';
                  let unit = match[2]?.trim() || '';
                  let name = match[3]?.trim() || i;
                  if (!unit && amount && /[a-zA-Z]/.test(amount)) {
                    const amtMatch = amount.match(/([\d.,/\s]+)([a-zA-Z%]+)/);
                    if (amtMatch) {
                      amount = amtMatch[1].trim();
                      unit = amtMatch[2].trim();
                    }
                  }
                  return { name, amount, unit };
                }
                return { name: i, amount: '', unit: '' };
              })
            : [{ name: '', amount: '', unit: '' }]
        );
        setDirectionsList(
          Array.isArray(data.instructions)
            ? data.instructions
            : typeof data.instructions === 'string' && data.instructions
            ? data.instructions.split('\n')
            : ['']
        );
        // Auto-select filters/tags if present in data.tags
        if (data.tags && Array.isArray(data.tags)) setTags(data.tags);
        setShowUrlModal(false);
      } else {
        setFetchError(data.error || 'Failed to fetch recipe');
      }
    } catch (err) {
      setFetchError('Network error');
    }
    setFetching(false);
  };

  const fetchRecipeFromUrl = async () => {
    setFetching(true);
    setFetchError('');
    console.log('Fetching recipe from URL:', url);
    try {
      // Use GET with query string for Render service
      const response = await fetch(`${RECIPE_SCRAPER_URL}?url=${encodeURIComponent(url)}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Data received:', data);
      if (response.ok) {
        setForm(f => ({
          ...f,
          title: data.title || '',
          image: data.image || '',
          notes: data.notes || '',
        }));
        setImageUri(data.image || '');
        setIngredientsList(
          Array.isArray(data.ingredients)
            ? data.ingredients.map((i: string) => {
                // Try to extract amount/unit/name from the string
                // e.g. "200g/ 7oz Oreo cookies" => amount: "200g/ 7oz", unit: "", name: "Oreo cookies"
                const match = i.match(/^([\d.,/\s]+)?\s*([a-zA-Z%]+)?\s*(.*)$/);
                if (match) {
                  let amount = match[1]?.trim() || '';
                  let unit = match[2]?.trim() || '';
                  let name = match[3]?.trim() || i;
                  // If unit is part of amount (e.g. "200g"), split
                  if (!unit && amount && /[a-zA-Z]/.test(amount)) {
                    const amtMatch = amount.match(/([\d.,/\s]+)([a-zA-Z%]+)/);
                    if (amtMatch) {
                      amount = amtMatch[1].trim();
                      unit = amtMatch[2].trim();
                    }
                  }
                  return { name, amount, unit };
                }
                return { name: i, amount: '', unit: '' };
              })
            : [{ name: '', amount: '', unit: '' }]
        );
        setDirectionsList(
          Array.isArray(data.instructions)
            ? data.instructions
            : typeof data.instructions === 'string' && data.instructions
            ? data.instructions.split('\n')
            : ['']
        );
        if (data.tags) setTags(data.tags);
      } else {
        setFetchError(data.error || 'Failed to fetch recipe');
      }
    } catch (err) {
      setFetchError('Network error');
      console.log('Network error:', err);
    }
    setFetching(false);
  };

  const handleFormSubmit = () => {
    // Store ingredients as array of objects (name, amount, unit)
    const ingredientsObjectArray = ingredientsList.filter(i => i.name.trim() !== '');
    // Directions as array of strings
    const directionsStringArray = directionsList.filter(Boolean);
    onSubmit({
      ...form,
      image: imageUri,
      ingredients: ingredientsObjectArray,
      directions: directionsStringArray,
      tags,
      privacy,
      rating: rating === '' || isNaN(Number(rating)) ? 'N/A' : Math.max(0, Math.min(10, parseFloat(rating))),
    });
    setForm({ title: '', image: '', notes: '' });
    setTags([]);
    setImageUri('');
    setIngredientsList([{ name: '', amount: '', unit: '' }]);
    setDirectionsList(['']);
    setPrivacy('private');
    setRating('');
    // Apple Pay style overlay animation
    setShowCreated(true);
    overlayAnim.setValue(0);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => setShowCreated(false));
      }, 1000);
    });
    // Scroll to top
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useImperativeHandle(ref, () => ({
    submit: handleFormSubmit
  }));

  return (
    <View style={[styles.fullPageContainer, { backgroundColor: colorScheme === 'dark' ? '#181C20' : '#fff' }]}> 
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: '2%',
          paddingHorizontal: '5%',
          paddingBottom: '25%',
        }}
      >
        {/* Only show the form title and method buttons if not in edit mode */}
        {!editMode && (
          <>
            <Text style={[styles.formTitle, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>Add a New Recipe</Text>
            {/* Single row of method buttons, manual selected by default, wider buttons and matching color scheme */}
            <View style={styles.methodBar}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { minWidth: 140, backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }
                ]}
                onPress={() => setShowUrlModal(true)}
              >
                <Ionicons name="link-outline" size={32} color={colorScheme === 'dark' ? '#fff' : '#222'} />
                <Text style={[styles.methodButtonTextInactive, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { minWidth: 140, backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }
                ]}
                disabled
              >
                <Ionicons name="camera-outline" size={32} color={colorScheme === 'dark' ? '#fff' : '#222'} />
                <Text style={[styles.methodButtonTextInactive, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>Camera</Text>
              </TouchableOpacity>
            </View>
            {/* Show clear form button only if showClearButton is true and not in edit mode */}
            {showClearButton && (
              <>
                <ConfirmDialog
                  visible={showConfirmClear}
                  onConfirm={() => {
                    setShowConfirmClear(false);
                    setForm({ title: '', image: '', notes: '' });
                    setTags([]);
                    setImageUri('');
                    setIngredientsList([{ name: '', amount: '', unit: '' }]);
                    setDirectionsList(['']);
                    setPrivacy('private');
                    setRating('');
                  }}
                  onCancel={() => setShowConfirmClear(false)}
                />
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB',
                      borderRadius: 8,
                      paddingVertical: 14,
                      borderWidth: 1,
                      borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0',
                      width: '80%',
                      alignItems: 'center',
                    }}
                    onPress={() => setShowConfirmClear(true)}
                  >
                    <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222', fontWeight: 'bold', fontSize: 16 }}>Clear Form</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}
        {/* Only one rating input at the top, remove any duplicate below */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text style={styles.label}>Rating (out of 10):</Text>
          <TextInput
            style={[styles.input, { width: 80, marginLeft: 8, marginBottom: 0, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
            placeholder="N/A"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            value={rating}
            onChangeText={v => {
              // Only allow numbers and one decimal point
              let val = v.replace(/[^\d.]/g, '');
              // Prevent multiple decimals
              if ((val.match(/\./g) || []).length > 1) return;
              // Clamp between 0 and 10 if not empty
              if (val !== '') {
                let num = parseFloat(val);
                if (isNaN(num)) {
                  setRating('');
                  return;
                }
                if (num > 10) val = '10';
                if (num < 0) val = '0';
              }
              setRating(val);
            }}
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <Text style={{ marginLeft: 8, color: '#888', fontSize: 16 }}>
            {rating === '' || isNaN(Number(rating)) ? 'N/A' : `/ 10`}
          </Text>
        </View>
        <Modal
          visible={showUrlModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowUrlModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>Paste Recipe URL</Text>
              <TextInput
                style={[styles.input, { marginBottom: 12 }]}
                placeholder="Paste recipe URL"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {fetchError ? <Text style={{ color: 'red', marginBottom: 8 }}>{fetchError}</Text> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  style={[styles.privacyButton, { marginRight: 8 }]}
                  onPress={() => setShowUrlModal(false)}
                  disabled={fetching}
                >
                  <Text style={styles.privacyButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.privacyButton, { backgroundColor: '#4F8EF7' }]}
                  onPress={handleUrlFetch}
                  disabled={fetching || !url}
                >
                  <Text style={[styles.privacyButtonText, { color: '#fff' }]}>{fetching ? 'Fetching...' : 'Fetch'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Text style={styles.label}>Dish Title</Text>
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
          placeholder="e.g. Spaghetti Carbonara"
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
          value={form.title}
          onChangeText={v => handleChange('title', v)}
        />
        <Text style={styles.label}>Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <Text style={{ color: '#888', fontSize: 16 }}>Tap to select an image</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.label}>Ingredients</Text>
        {ingredientsList.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { flex: 2, marginBottom: 0, marginRight: 4, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
              placeholder={`Ingredient ${idx + 1}`}
              placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
              value={item.name}
              onChangeText={v => handleIngredientChange(idx, 'name', v)}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 4, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
              placeholder="Amt"
              placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
              value={item.amount}
              onChangeText={v => handleIngredientChange(idx, 'amount', v)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
              placeholder="Unit"
              placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
              value={item.unit}
              onChangeText={v => handleIngredientChange(idx, 'unit', v)}
            />
            {ingredientsList.length > 1 && (
              <TouchableOpacity onPress={() => removeIngredient(idx)} style={{ marginLeft: 8 }}>
                <Text style={{ color: '#FF6961', fontSize: 24 }}>–</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ alignItems: 'center', width: '100%' }}>
          <TouchableOpacity onPress={addIngredient} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#4F8EF7', fontSize: 20 }}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Directions</Text>
        {directionsList.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
              placeholder={`Step ${idx + 1}`}
              placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
              value={item}
              onChangeText={v => handleDirectionChange(idx, v)}
            />
            {directionsList.length > 1 && (
              <TouchableOpacity onPress={() => removeDirection(idx)} style={{ marginLeft: 8 }}>
                <Text style={{ color: '#FF6961', fontSize: 24 }}>–</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ alignItems: 'center', width: '100%' }}>
          <TouchableOpacity onPress={addDirection} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#4F8EF7', fontSize: 20 }}>+ Add Step</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagsContainer}>
          {filterCategories.map(cat => (
            <View key={cat.name} style={{ marginBottom: 8 }}>
              <Text style={styles.tagCategory}>{cat.name}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cat.options.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.tag, tags.includes(opt.value) && styles.tagSelected]}
                    onPress={() => handleTagToggle(opt.value)}
                  >
                    <Text style={[styles.tagText, tags.includes(opt.value) && styles.tagTextSelected]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 60, color: colorScheme === 'dark' ? '#fff' : '#11181C', backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
          placeholder="Any extra notes (optional)"
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
          value={form.notes}
          onChangeText={v => handleChange('notes', v)}
          multiline
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            style={[styles.privacyButton, privacy === 'private' && { backgroundColor: '#4F8EF7' }]}
            onPress={() => setPrivacy('private')}
          >
            <Text style={[styles.privacyButtonText, privacy === 'private' && { color: '#fff' }]}>Private</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.privacyButton, { marginLeft: 16 }, privacy === 'public' && { backgroundColor: '#4F8EF7' }]}
            onPress={() => setPrivacy('public')}
          >
            <Text style={[styles.privacyButtonText, privacy === 'public' && { color: '#fff' }]}>Public</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit}>
          <Text style={styles.submitButtonText}>Save Recipe</Text>
        </TouchableOpacity>
        {/* Add a clear button at the bottom of the form */}
      </ScrollView>
      {showCreated && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: overlayAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(79,142,247,0)', 'rgba(79,142,247,0.18)']
            }),
            alignItems: 'center',
            justifyContent: 'center',
            opacity: overlayAnim,
            zIndex: 100,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: '#fff',
              borderRadius: 32,
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 8,
              flexDirection: 'row',
              minWidth: 180,
              transform: [{ scale: overlayAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.7, 1.15, 1] }) }],
            }}
          >
            <Animated.View
              style={{
                transform: [{ scale: overlayAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.2, 1] }) }],
              }}
            >
              <Ionicons name="checkmark-circle" size={54} color="#22C55E" />
            </Animated.View>
            <Text style={{ color: '#222', fontSize: 28, fontWeight: 'bold', letterSpacing: 1, marginLeft: 12 }}>Created</Text>
          </Animated.View>
        </Animated.View>
      )}
      <Modal
        visible={showUrlModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fetch Recipe from URL</Text>
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Enter recipe URL"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {fetchError ? <Text style={{ color: 'red', marginBottom: 8 }}>{fetchError}</Text> : null}
            <TouchableOpacity
              style={[styles.privacyButton, { backgroundColor: '#4F8EF7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
              onPress={handleUrlFetch}
              disabled={fetching || !url}
            >
              {fetching && (
                <View style={{ marginRight: 6 }}>
                  <Animated.View style={{
                    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff', borderTopColor: '#4F8EF7',
                    borderStyle: 'solid',
                    transform: [{ rotate: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
                  }} />
                </View>
              )}
              <Text style={[styles.privacyButtonText, { color: '#fff' }]}>
                {fetching ? 'Fetching...' : 'Fetch'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowUrlModal(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: '#4F8EF7', fontSize: 16, fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default RecipeForm;

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 600,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F8EF7',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  imagePicker: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    overflow: 'hidden',
  },
  tagsContainer: {
    marginBottom: 12,
  },
  tagCategory: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4F8EF7',
    marginBottom: 4,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E6F7FA',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: '#4F8EF7',
  },
  tagText: {
    color: '#007B8A',
    fontWeight: '600',
    fontSize: 15,
  },
  tagTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  privacyButton: {
    backgroundColor: '#E6F7FA',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4F8EF7',
  },
  privacyButtonText: {
    color: '#4F8EF7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fullPageContainer: {
    flex: 1,
    // backgroundColor: '#fff', // Remove static color, now set dynamically
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 0,
    marginTop: 0,
    marginBottom: 0,
    maxWidth: undefined,
    paddingHorizontal: 0,
  },
  methodBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    gap: 16,
  },
  methodButton: {
    backgroundColor: '#F8FAFB',
    borderRadius: 16,
    paddingVertical: 8, // thinner
    paddingHorizontal: 10, // smaller width
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    minWidth: 80, // smaller min width
    maxWidth: 110, // limit max width
  },
  methodButtonActive: {
    backgroundColor: '#4F8EF7',
    borderColor: '#4F8EF7',
  },
  methodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  methodButtonTextInactive: {
    color: '#4F8EF7',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  methodIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
});
