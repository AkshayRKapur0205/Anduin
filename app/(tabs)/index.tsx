import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text, PanResponder, Animated, Dimensions, ScrollView, TouchableWithoutFeedback, Modal, Easing } from 'react-native';

const dishes = [
  {
    id: 1,
    title: 'Spaghetti Carbonara',
    image: require('@/assets/images/react-logo.png'),
    author: 'Chef Mario',
    likes: 120,
    ingredients: ['Spaghetti', 'Eggs', 'Pancetta', 'Parmesan', 'Pepper'],
    directions: '1. Boil pasta. 2. Cook pancetta. 3. Mix with eggs and cheese. 4. Combine.'
  },
  {
    id: 2,
    title: 'Avocado Toast',
    image: require('@/assets/images/partial-react-logo.png'),
    author: 'Chef Anna',
    likes: 87,
    ingredients: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Lemon'],
    directions: '1. Toast bread. 2. Mash avocado. 3. Spread and season.'
  },
];

export default function HomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const position = React.useRef(new Animated.ValueXY()).current;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const [imageAnim] = useState(new Animated.Value(0)); // 0 = card, 1 = fullscreen
  const [scaleAnim] = useState(new Animated.Value(1)); // for zoom effect
  const [opacityAnim] = useState(new Animated.Value(1)); // for fade effect
  const [tapAnim] = useState(new Animated.Value(0)); // 0 = rest, 1 = moved up/zoomed
  const [zoomAnim] = useState(new Animated.Value(0)); // 0 = rest, 1 = zoomed in

  // Track if a tap occurred
  const tapTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const tapStart = React.useRef<{ x: number; y: number } | null>(null);

  // Helper to control card visibility
  const [showCard, setShowCard] = useState(true);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        tapStart.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
      },
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: Animated.event([
        null,
        { dx: position.x }
      ], { useNativeDriver: false }),
      onPanResponderRelease: (evt, gesture) => {
        // Detect tap (minimal movement)
        if (Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10) {
          openModal();
          position.setValue({ x: 0, y: 0 });
          return;
        }
        if (gesture.dx > 120) {
          setSwipeIndicator('right');
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex((prev) => (prev + 1) % dishes.length);
            setTimeout(() => setSwipeIndicator(null), 400);
          });
        } else if (gesture.dx < -120) {
          setSwipeIndicator('left');
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex((prev) => (prev + 1) % dishes.length);
            setTimeout(() => setSwipeIndicator(null), 400);
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Animate card to fullscreen and show modal at the start
  const openModal = () => {
    Animated.timing(zoomAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setShowCard(false);
      setModalVisible(true);
      zoomAnim.setValue(0); // reset for next time
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setShowCard(true);
  };

  // Interpolate image/card position/size for animation
  const cardWidth = 360;
  const cardHeight = 500;
  const fullWidth = Dimensions.get('window').width;
  // Subtract a fixed value for nav bar (e.g., 80px)
  const navBarHeight = 80;
  const fullHeight = Dimensions.get('window').height - navBarHeight;
  const cardAnimWidth = imageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardWidth, fullWidth],
  });
  const cardAnimHeight = imageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [cardHeight, fullHeight],
  });
  const cardAnimBorderRadius = imageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });
  const cardAnimTop = imageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });
  const cardAnimLeft = imageAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  // Interpolate for move up and zoom
  const tapAnimTranslateY = tapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });
  const tapAnimScale = tapAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  // Interpolate for zoom in and pop effect
  const zoomAnimScale = zoomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const zoomAnimOpacity = zoomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  const dish = dishes[currentIndex];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      {showCard && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              width: cardAnimWidth,
              height: cardAnimHeight,
              borderRadius: cardAnimBorderRadius,
              top: cardAnimTop,
              left: cardAnimLeft,
              position: 'relative',
              transform: [
                { translateX: position.x },
                { scale: zoomAnimScale },
              ],
              opacity: zoomAnimOpacity,
              zIndex: modalVisible ? 100 : 1,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={openModal}>
            <View style={{ flex: 1, width: '100%', height: '100%' }}>
              <Image source={dish.image} style={[styles.dishImage, { borderRadius: 0 }]} />
              <View style={styles.overlay} pointerEvents="none">
                <Text style={styles.dishTitle}>{dish.title}</Text>
                <Text style={styles.likes}>{dish.likes} Likes</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
      {swipeIndicator === 'left' && (
        <View style={styles.indicatorLeft}>
          <Text style={styles.indicatorText}>✗</Text>
        </View>
      )}
      {swipeIndicator === 'right' && (
        <View style={styles.indicatorRight}>
          <Text style={styles.indicatorText}>✓</Text>
        </View>
      )}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.fullscreenModalContainer}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.closeIconContainerAbsolute}>
              <Text style={styles.closeIcon}>✕</Text>
            </View>
          </TouchableWithoutFeedback>
          <ScrollView style={styles.fullscreenScroll} contentContainerStyle={styles.fullscreenScrollContent}>
            <Animated.View
              style={[
                styles.card,
                {
                  width: cardAnimWidth,
                  height: cardAnimHeight, // animate height as well
                  borderRadius: cardAnimBorderRadius,
                  top: 0,
                  left: 0,
                  position: 'relative',
                  alignSelf: 'center',
                  zIndex: 100,
                  marginBottom: 0,
                },
              ]}
            >
              <Image source={dish.image} style={[styles.dishImage, { borderRadius: 0 }]} />
              <View style={styles.overlay} pointerEvents="none">
                <Text style={styles.dishTitle}>{dish.title}</Text>
                <Text style={styles.likes}>{dish.likes} Likes</Text>
              </View>
            </Animated.View>
            <View style={styles.infoSectionStatic}>
              <Text style={styles.infoSectionTitle}>Notes</Text>
              <Text style={styles.infoSectionText}>No notes yet.</Text>
              <Text style={styles.infoSectionTitle}>Ingredients</Text>
              {dish.ingredients.map((ing, i) => (
                <Text key={i} style={styles.infoSectionText}>- {ing}</Text>
              ))}
              <Text style={styles.infoSectionTitle}>Directions</Text>
              <Text style={styles.infoSectionText}>{dish.directions}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    height: 500,
    backgroundColor: '#222',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 16,
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dishTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  likes: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 12,
  },
  indicatorLeft: {
    position: 'absolute',
    left: 32,
    top: '50%',
    transform: [{ translateY: -50 }], // make it more vertically stretched
    backgroundColor: 'rgba(255,0,0,0.25)', // lower opacity
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 32, // larger vertically
    zIndex: 10,
  },
  indicatorRight: {
    position: 'absolute',
    right: 32,
    top: '50%',
    transform: [{ translateY: -50 }], // make it more vertically stretched
    backgroundColor: 'rgba(0,200,0,0.25)', // lower opacity
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 32, // larger vertically
    zIndex: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  fullscreenScroll: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenScrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 40,
  },
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 0,
  },
  fullscreenImageCard: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  fullscreenInfoContainerWithBg: {
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 32,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  fullscreenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  fullscreenAuthor: {
    color: '#A1CEDC',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  fullscreenLikes: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  fullscreenSection: {
    fontWeight: 'bold',
    color: '#A1CEDC',
    marginTop: 16,
    marginBottom: 4,
    fontSize: 20,
    alignSelf: 'flex-start',
  },
  fullscreenText: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 2,
    marginLeft: 8,
  },
  closeModal: {
    color: '#A1CEDC',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 32,
    alignSelf: 'center',
    textDecorationLine: 'underline',
    marginBottom: 40,
  },
  closeIconContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeIconContainerAbsolute: {
    position: 'absolute',
    top: 64, // increased from 40 for more offset
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 4,
  },
  closeIcon: {
    color: '#A1CEDC',
    fontSize: 28,
    fontWeight: 'bold',
  },
  infoSection: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 32,
  },
  infoSectionStatic: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoSectionContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoSectionTitle: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  infoSectionText: {
    color: '#222',
    fontSize: 16,
    marginBottom: 2,
    marginLeft: 8,
  },
});
