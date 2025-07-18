import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function AccountScreen() {
  const colorScheme = useColorScheme && useColorScheme() || 'light';
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Account</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>Manage your account and settings here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
});
