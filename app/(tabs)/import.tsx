import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeForm from '../components/RecipeForm';
import { supabase } from '../supabaseClient';

export default function ImportScreen() {
  const colorScheme = useColorScheme && useColorScheme() || 'light';
  const [activeTab, setActiveTab] = useState<'manual' | 'url' | 'camera'>('manual');
  const [showForm, setShowForm] = useState(true); // Always show form for manual
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }]} edges={["top"]}>
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }]}> 
        {/* Remove the navBarTabs header bar */}
        {/* Only show RecipeForm for manual for now */}
        {activeTab === 'manual' && (
          <RecipeForm
            onSubmit={async (data) => {
              let imageUrl = '';
              // Only upload to Supabase Storage if privacy is public
              if (data.privacy === 'public' && data.image && data.image.startsWith('file://')) {
                const fileExt = data.image.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const fileUri = data.image;
                const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
                const { data: uploadData, error: uploadError } = await supabase.storage.from('dish-images').upload(fileName, Buffer.from(fileContent, 'base64'), {
                  contentType: `image/${fileExt}`,
                  upsert: true,
                });
                if (!uploadError && uploadData) {
                  imageUrl = supabase.storage.from('dish-images').getPublicUrl(fileName).data.publicUrl;
                }
              }
              // Prepare ingredients and directions for storage
              const ingredients = Array.isArray(data.ingredients)
                ? data.ingredients.map((i: any) => typeof i === 'string' ? i : `${i.amount} ${i.unit} ${i.name}`.trim()).filter(Boolean)
                : data.ingredients;
              const directions = Array.isArray(data.directions)
                ? data.directions.filter(Boolean).join('\n')
                : data.directions;
              if (data.privacy === 'public') {
                // Insert new dish into Supabase
                const { error } = await supabase.from('dishes').insert([
                  {
                    title: data.title,
                    image: imageUrl,
                    notes: data.notes,
                    ingredients,
                    directions,
                    tags: data.tags,
                    privacy: data.privacy,
                    likes: 0,
                    created_at: new Date().toISOString(),
                  },
                ]);
                if (error) {
                  console.error('Error saving dish:', error);
                }
              } else {
                // Save private recipe locally
                const privateRecipe = {
                  id: `private-${Date.now()}`,
                  title: data.title,
                  image: data.image,
                  notes: data.notes,
                  ingredients,
                  directions,
                  tags: data.tags,
                  privacy: data.privacy,
                  likes: 0,
                  created_at: new Date().toISOString(),
                };
                try {
                  const existing = await AsyncStorage.getItem('privateRecipes');
                  const recipes = existing ? JSON.parse(existing) : [];
                  recipes.unshift(privateRecipe);
                  await AsyncStorage.setItem('privateRecipes', JSON.stringify(recipes));
                } catch (e) {
                  console.error('Error saving private recipe locally:', e);
                }
              }
            }}
            showClearButton={true}
          />
        )}
        {/* Placeholder for other tabs */}
        {activeTab === 'url' && (
          <View style={styles.placeholder}><Text style={[styles.placeholderText, { color: colorScheme === 'dark' ? '#bbb' : '#888' }]}>Coming soon: Add via URL</Text></View>
        )}
        {activeTab === 'camera' && (
          <View style={styles.placeholder}><Text style={[styles.placeholderText, { color: colorScheme === 'dark' ? '#bbb' : '#888' }]}>Coming soon: Add with Camera</Text></View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#23272F' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#F8FAFB' },
  navBarTabs: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#23272F', // dark background
    // borderRadius removed for square edges
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 0,
    paddingVertical: 12,
    borderRadius: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  navButtonActive: {
    backgroundColor: '#4F8EF7', // blue highlight for active
  },
  navButtonText: {
    color: '#A1CEDC', // lighter blue for inactive
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  navButtonTextActive: {
    color: '#fff',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  placeholderText: {
    color: '#888',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
  },
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
