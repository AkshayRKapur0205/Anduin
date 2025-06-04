import React from 'react';
import { View, Text, Pressable, Modal, Animated, Dimensions, StyleSheet, ScrollView } from 'react-native';

interface FiltersBarProps {
  onFiltersChange?: (filters: string[]) => void;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterCategory {
  name: string;
  options: FilterOption[];
}

const FILTER_CATEGORIES: FilterCategory[] = [
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const FiltersBar: React.FC<FiltersBarProps> = ({ onFiltersChange }) => {
  // Internal state for selected filters and menu visibility
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [menuVisible, setMenuVisible] = React.useState(false);
  // Slide-in animation for the side menu
  const slideAnim = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [localSelected, setLocalSelected] = React.useState<string[]>(selectedFilters);

  React.useEffect(() => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [menuVisible]);

  // When menu opens, sync localSelected with selectedFilters
  React.useEffect(() => {
    if (menuVisible) setLocalSelected(selectedFilters);
  }, [menuVisible, selectedFilters]);

  // When menu closes, update selectedFilters with localSelected
  React.useEffect(() => {
    if (!menuVisible && localSelected.join(',') !== selectedFilters.join(',')) {
      setSelectedFilters(localSelected);
    }
  }, [menuVisible]);

  // Notify parent when selectedFilters changes (but not during render)
  React.useEffect(() => {
    if (onFiltersChange) onFiltersChange(selectedFilters);
  }, [selectedFilters, onFiltersChange]);

  const toggleFilter = (value: string) => {
    setLocalSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Only update local state on remove, do not call parent directly
  const onRemoveFilter = (filter: string) => {
    setSelectedFilters((prev) => prev.filter((f) => f !== filter));
  };

  return (
    <>
      <View
        style={[
          styles.headerBar,
          { backgroundColor: 'rgba(255,255,255,0.0)', borderBottomWidth: 0, height: 56 * 1.15, paddingHorizontal: 16 * 1.15 },
        ]}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedFilters.length === 0 ? (
            <Text style={{ color: '#222', fontWeight: '600', fontSize: 16 * 1.15 }}>
              Filters: <Text style={{ color: '#A1CEDC', fontWeight: 'bold', fontSize: 16 * 1.15 }}>All</Text>
            </Text>
          ) : (
            selectedFilters.map((filter, idx) => (
              <View
                key={filter + idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E6F7FA',
                  borderRadius: 12 * 1.15,
                  paddingHorizontal: 10 * 1.15,
                  paddingVertical: 4 * 1.15,
                  marginRight: 8 * 1.15,
                  marginBottom: 2 * 1.15,
                }}
              >
                <Text style={{ color: '#007B8A', fontWeight: 'bold', fontSize: 14 * 1.15 }}>{filter}</Text>
                <Pressable
                  onPress={() => onRemoveFilter(filter)}
                  style={{ marginLeft: 6, padding: 2 }}
                >
                  <Text style={{ color: '#007B8A', fontWeight: 'bold', fontSize: 16 }}>&times;</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Pressable onPress={() => setMenuVisible(true)} style={{ padding: 8 * 1.15, marginLeft: 12 * 1.15 }}>
          <View style={{ width: 28 * 1.15, height: 28 * 1.15, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 22 * 1.15, height: 3 * 1.15, backgroundColor: '#222', borderRadius: 2 * 1.15, marginBottom: 4 * 1.15 }} />
            <View style={{ width: 22 * 1.15, height: 3 * 1.15, backgroundColor: '#222', borderRadius: 2 * 1.15, marginBottom: 4 * 1.15 }} />
            <View style={{ width: 22 * 1.15, height: 3 * 1.15, backgroundColor: '#222', borderRadius: 2 * 1.15 }} />
          </View>
        </Pressable>
      </View>
      <Modal
        visible={menuVisible}
        animationType="none"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={[styles.modalOverlay, { height: SCREEN_HEIGHT }]} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuVisible(false)} pointerEvents="auto" />
          <Animated.View
            style={[
              styles.sideMenu,
              {
                right: 0,
                transform: [{ translateX: slideAnim }],
                width: 260 * 1.15,
                padding: 24 * 1.15,
                borderTopLeftRadius: 18 * 1.15,
                borderBottomLeftRadius: 18 * 1.15,
                height: SCREEN_HEIGHT,
              },
            ]}
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
          >
            <Pressable
              onPress={() => setMenuVisible(false)}
              style={{
                position: 'absolute',
                top: 38 * 1.15, // moved down from 18
                right: 18 * 1.15,
                zIndex: 10,
                backgroundColor: '#E6F7FA',
                borderRadius: 20,
                paddingVertical: 6,
                paddingHorizontal: 16,
                elevation: 2,
              }}
            >
              <Text style={{ color: '#007B8A', fontWeight: 'bold', fontSize: 16 * 1.15 }}>Close Filters</Text>
            </Pressable>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 18 * 1.15,
                marginBottom: 12 * 1.15,
                marginTop: 48 * 1.15, // moved down from 16/36
              }}
            >
              Select Filters
            </Text>
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ paddingTop: 24 * 1.15, paddingBottom: 24 * 1.15 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
            >
              {FILTER_CATEGORIES.map((cat) => (
                <View key={cat.name} style={{ marginBottom: 12 * 1.15 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#A1CEDC',
                      fontSize: 16 * 1.15,
                      marginBottom: 6 * 1.15,
                    }}
                  >
                    {cat.name}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {cat.options.map((opt) => {
                      const checked = localSelected.includes(opt.value);
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => toggleFilter(opt.value)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: 12 * 1.15,
                            marginBottom: 8 * 1.15,
                          }}
                        >
                          <View
                            style={{
                              width: 22 * 1.15,
                              height: 22 * 1.15,
                              borderRadius: 6 * 1.15,
                              borderWidth: 2,
                              borderColor: checked ? '#A1CEDC' : '#bbb',
                              backgroundColor: checked ? '#A1CEDC' : '#fff',
                              marginRight: 6 * 1.15,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            {checked && (
                              <View
                                style={{
                                  width: 12 * 1.15,
                                  height: 12 * 1.15,
                                  backgroundColor: '#fff',
                                  borderRadius: 3 * 1.15,
                                }}
                              />
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 15 * 1.15,
                              color: checked ? '#007B8A' : '#222',
                              fontWeight: checked ? 'bold' : 'normal',
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 260,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 200,
    right: 0,
  },
});

export default FiltersBar;
