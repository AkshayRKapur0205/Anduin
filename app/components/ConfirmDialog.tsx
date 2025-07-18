import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ visible, onConfirm, onCancel, message }) => {
  const colorScheme = useColorScheme && useColorScheme() || 'light';
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colorScheme === 'dark' ? '#23272F' : '#fff' }]}> 
          <Text style={[styles.message, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>
            {message || 'Are you sure you want to clear this form?'}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colorScheme === 'dark' ? '#23272F' : '#F8FAFB', borderColor: colorScheme === 'dark' ? '#444' : '#E0E0E0' }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#FF6961', borderColor: '#FF6961' }]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConfirmDialog;
