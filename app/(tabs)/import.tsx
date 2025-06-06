import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import RecipeForm from '../components/RecipeForm';

export default function ImportScreen() {
  const [showForm, setShowForm] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string>('');
  const [filterCategories, setFilterCategories] = useState<{ name: string; options: { label: string; value: string }[] }[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      const { data, error } = await supabase.from('filters').select('*');
      if (error) {
        console.error('Error fetching filters:', error);
        return;
      }
      // Group by category
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
      <RecipeForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => {
          // TODO: Save the new card (call backend or update state)
          setShowForm(false);
        }}
      />
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
});
