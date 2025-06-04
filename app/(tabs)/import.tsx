import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Modal, TextInput, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImportScreen() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    image: '',
    ingredients: '',
    directions: '',
    notes: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string>('');

  // Filter options from FiltersBar
  const FILTER_CATEGORIES = [
    {
      name: 'Dietary',
      options: [
        { label: 'Vegan', value: 'vegan' },
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Pescatarian', value: 'pescatarian' },
        { label: 'Gluten Free', value: 'gluten_free' },
        { label: 'Dairy Free', value: 'dairy_free' },
        { label: 'Nut Free', value: 'nut_free' },
        { label: 'Egg Free', value: 'egg_free' },
        { label: 'Soy Free', value: 'soy_free' },
        { label: 'Halal', value: 'halal' },
        { label: 'Kosher', value: 'kosher' },
      ],
    },
    {
      name: 'Macronutrients',
      options: [
        { label: 'High Protein', value: 'high_protein' },
        { label: 'High Carbs', value: 'high_carbs' },
        { label: 'Low Carbs', value: 'low_carbs' },
        { label: 'Low Fat', value: 'low_fat' },
        { label: 'High Fiber', value: 'high_fiber' },
        { label: 'Keto', value: 'keto' },
        { label: 'Paleo', value: 'paleo' },
      ],
    },
    {
      name: 'Meal Type',
      options: [
        { label: 'Breakfast', value: 'breakfast' },
        { label: 'Lunch', value: 'lunch' },
        { label: 'Dinner', value: 'dinner' },
        { label: 'Snack', value: 'snack' },
        { label: 'Dessert', value: 'dessert' },
        { label: 'Drink', value: 'drink' },
      ],
    },
    {
      name: 'Cuisine',
      options: [
        { label: 'Italian', value: 'italian' },
        { label: 'Mexican', value: 'mexican' },
        { label: 'Indian', value: 'indian' },
        { label: 'Chinese', value: 'chinese' },
        { label: 'Japanese', value: 'japanese' },
        { label: 'Thai', value: 'thai' },
        { label: 'French', value: 'french' },
        { label: 'American', value: 'american' },
        { label: 'Mediterranean', value: 'mediterranean' },
        { label: 'Middle Eastern', value: 'middle_eastern' },
      ],
    },
  ];

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
  const handleSubmit = () => {
    // TODO: Save the new card (call backend or update state)
    setShowForm(false);
    setForm({ title: '', image: '', ingredients: '', directions: '', notes: '' });
    setTags([]);
    setImageUri('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.manualButton]} onPress={() => setShowForm(true)}>
        <Text style={styles.buttonText}>Add Manually</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.urlButton]}>
        <Text style={styles.buttonText}>Add via URL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.cameraButton]}>
        <Text style={styles.buttonText}>Add with Camera</Text>
      </TouchableOpacity>
      <Modal visible={showForm} animationType="slide" transparent>
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
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsContainer}>
                {FILTER_CATEGORIES.map(cat => (
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
              <Text style={styles.label}>Ingredients</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="List ingredients, separated by commas"
                value={form.ingredients}
                onChangeText={v => handleChange('ingredients', v)}
                multiline
              />
              <Text style={styles.label}>Directions</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Describe the steps to make this dish"
                value={form.directions}
                onChangeText={v => handleChange('directions', v)}
                multiline
              />
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Any extra notes (optional)"
                value={form.notes}
                onChangeText={v => handleChange('notes', v)}
                multiline
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Save Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={{ color: '#FF6961', textAlign: 'center', marginTop: 12, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  button: {
    width: '90%',
    paddingVertical: 36,
    backgroundColor: '#FFD580', // fallback color
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 16,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualButton: {
    backgroundColor: '#FFB347', // orange for manual (like a chef's apron)
  },
  urlButton: {
    backgroundColor: '#FF6961', // tomato red for url (like tomato sauce)
  },
  cameraButton: {
    backgroundColor: '#A3D977', // green for camera (like herbs/veggies)
  },
  buttonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
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
});
