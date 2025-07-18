import { StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function CommunityScreen() {
  const colorScheme = useColorScheme && useColorScheme() || 'light';

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }}>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222', ...styles.title }}>Community</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>Connect with other food lovers in the community tab.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
});
