import { View, Text, StyleSheet } from 'react-native';

export default function ImportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import</Text>
      <Text>Import your favorite recipes here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
});
