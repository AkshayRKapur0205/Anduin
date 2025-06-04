import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SwipeIndicatorProps {
  direction: 'left' | 'right';
  visible: boolean;
  style?: object;
}

export default function SwipeIndicator({ direction, visible, style }: SwipeIndicatorProps) {
  if (!visible) return null;
  return (
    <View style={[direction === 'left' ? styles.indicatorLeft : styles.indicatorRight, style]} pointerEvents="none">
      <Text style={styles.indicatorText}>{direction === 'left' ? '✗' : '✓'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  indicatorLeft: {
    position: 'absolute',
    left: '8%',
    top: '20%',
    height: '60%',
    width: '18%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorRight: {
    position: 'absolute',
    right: '8%',
    top: '20%',
    height: '60%',
    width: '18%',
    borderRadius: 999,
    backgroundColor: 'rgba(0, 200, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
