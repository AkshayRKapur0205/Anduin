import React, { useState, useEffect } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View, ScrollView, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface RecipeFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function RecipeForm({ visible, onClose, onSubmit }: RecipeFormProps) {
  const [form, setForm] = useState({
    title: '',
    image: '',
    notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string>('');
  const [filterCategories, setFilterCategories] = useState<{ name: string; options: { label: string; value: string }[] }[]>([]);
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [directionsList, setDirectionsList] = useState<string[]>(['']);
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private');

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

  const handleFormSubmit = () => {
    onSubmit({
      ...form,
      image: imageUri,
      ingredients: ingredientsList,
      directions: directionsList,
      tags,
      privacy,
    });
    setForm({ title: '', image: '', notes: '' });
    setTags([]);
    setImageUri('');
    setIngredientsList([{ name: '', amount: '', unit: '' }]);
    setDirectionsList(['']);
    setPrivacy('private');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.formContainer}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.formTitle}>Add a New Recipe</Text>
            <Text style={styles.label}>Dish Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Spaghetti Carbonara"
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
                  style={[styles.input, { flex: 2, marginBottom: 0, marginRight: 4 }]}
                  placeholder={`Ingredient ${idx + 1}`}
                  value={item.name}
                  onChangeText={v => handleIngredientChange(idx, 'name', v)}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 4 }]}
                  placeholder="Amt"
                  value={item.amount}
                  onChangeText={v => handleIngredientChange(idx, 'amount', v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Unit"
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
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={`Step ${idx + 1}`}
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
              style={[styles.input, { height: 60 }]}
              placeholder="Any extra notes (optional)"
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
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#FF6961', textAlign: 'center', marginTop: 12, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '90%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
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
});
