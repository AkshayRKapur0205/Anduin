import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text, PanResponder, Animated, Dimensions, ScrollView, TouchableWithoutFeedback, Easing } from 'react-native';

const dishes = [
	{
		id: 1,
		title: 'Spaghetti Carbonara',
		image: require('@/assets/images/react-logo.png'),
		author: 'Chef Mario',
		likes: 120,
		ingredients: ['Spaghetti', 'Eggs', 'Pancetta', 'Parmesan', 'Pepper'],
		directions: '1. Boil pasta. 2. Cook pancetta. 3. Mix with eggs and cheese. 4. Combine.',
	},
	{
		id: 2,
		title: 'Avocado Toast',
		image: require('@/assets/images/partial-react-logo.png'),
		author: 'Chef Anna',
		likes: 87,
		ingredients: ['Bread', 'Avocado', 'Salt', 'Pepper', 'Lemon'],
		directions: '1. Toast bread. 2. Mash avocado. 3. Spread and season.',
	},
];

// Place these constants above the StyleSheet.create call
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.9);
const CARD_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);
const INDICATOR_WIDTH = Math.round(CARD_WIDTH * 0.18);
const INDICATOR_HEIGHT = CARD_HEIGHT;
const INDICATOR_OFFSET = Math.round((SCREEN_HEIGHT - CARD_HEIGHT) / 2);
const NAV_BAR_HEIGHT = 80;

// Place this above HomeScreen
const panResponder = React.createRef();

export default function HomeScreen() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);
	const [cardExpanded, setCardExpanded] = useState(false);
	const position = React.useRef(new Animated.ValueXY()).current;
	const [imageAnim] = useState(new Animated.Value(0)); // 0 = card, 1 = fullscreen
	const [scaleAnim] = useState(new Animated.Value(1)); // for zoom effect
	const [opacityAnim] = useState(new Animated.Value(1)); // for fade effect
	const [tapAnim] = useState(new Animated.Value(0)); // 0 = rest, 1 = moved up/zoomed
	const [zoomAnim] = useState(new Animated.Value(0)); // 0 = rest, 1 = zoomed in
	const [backCardScale] = useState(new Animated.Value(0.85)); // Scale for the back card
	const cardAnimTop = new Animated.Value(0); // add this line
	// Card height animation value
	const cardAnimHeight = React.useRef(new Animated.Value(CARD_HEIGHT)).current;
	// Card width animation value
	const cardAnimWidthValue = React.useRef(new Animated.Value(CARD_WIDTH)).current;

	// Animate card to fullscreen and show modal at the start
	const openModal = () => {
		setCardExpanded(true);
		Animated.parallel([
			Animated.timing(cardAnimHeight, {
				toValue: SCREEN_HEIGHT, // grow card to full height (entire screen)
				duration: 900, // slower animation
				easing: Easing.bezier(0.22, 1, 0.36, 1),
				useNativeDriver: false,
			}),
			Animated.timing(cardAnimWidthValue, {
				toValue: SCREEN_WIDTH, // animate width to full
				duration: 900, // match height animation
				easing: Easing.bezier(0.22, 1, 0.36, 1),
				useNativeDriver: false,
			}),
		]).start();
	};

	const closeModal = () => {
		Animated.parallel([
			Animated.timing(cardAnimHeight, {
				toValue: CARD_HEIGHT,
				duration: 700, // slower animation
				easing: Easing.bezier(0.22, 1, 0.36, 1),
				useNativeDriver: false,
			}),
			Animated.timing(cardAnimWidthValue, {
				toValue: CARD_WIDTH,
				duration: 700,
				easing: Easing.bezier(0.22, 1, 0.36, 1),
				useNativeDriver: false,
			}),
		]).start(() => setCardExpanded(false));
	};

	// Interpolate image/card position/size for animation
	const cardAnimWidth = imageAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [CARD_WIDTH, SCREEN_WIDTH],
	});
	const cardAnimBorderRadius = imageAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [16, 24], // grow border radius for effect
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

	// Use a derived value for swipe indicator visibility
	const [dragX, setDragX] = useState(0);
	React.useEffect(() => {
		const id = position.x.addListener(({ value }) => setDragX(value));
		return () => position.x.removeListener(id);
	}, [position.x]);
	const showLeftIndicator = dragX < -20 || swipeIndicator === 'left';
	const showRightIndicator = dragX > 20 || swipeIndicator === 'right';

	// Animate the back card scale to 1 when swiping
	React.useEffect(() => {
		if (Math.abs(dragX) > 20) {
			Animated.timing(backCardScale, {
				toValue: 1,
				duration: 700, // slower and smoother
				easing: Easing.bezier(0.22, 1, 0.36, 1), // smooth ease-out
				useNativeDriver: false,
			}).start();
		} else {
			Animated.timing(backCardScale, {
				toValue: 0.85,
				duration: 700, // slower and smoother
				easing: Easing.bezier(0.22, 1, 0.36, 1), // smooth ease-out
				useNativeDriver: false,
			}).start();
		}
	}, [dragX]);

	// Helper to get the next dish index
	const getNextIndex = (dir: 'left' | 'right') => {
		if (dir === 'right') {
			return (currentIndex + 1) % dishes.length;
		} else {
			return (currentIndex - 1 + dishes.length) % dishes.length;
		}
	};

	// Calculate the next card index for both directions
	const nextIndex = getNextIndex('right');
	const prevIndex = getNextIndex('left');

	// Track if a tap occurred
	const tapStart = React.useRef<{ x: number; y: number } | null>(null);

	// PanResponder setup
	if (!panResponder.current) {
		panResponder.current = PanResponder.create({
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
				{ dx: position.x },
			],
			{ useNativeDriver: false }),
			onPanResponderRelease: (evt, gesture) => {
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
		});
	}

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingBottom: 0 }}>
			{/* Render the next card behind the current card */}
			<Animated.View
				pointerEvents="none"
				style={[
					styles.card,
					{
						width: cardAnimWidth,
						height: cardAnimHeight,
						borderRadius: cardAnimBorderRadius,
						position: 'absolute',
						left: '5%',
						top: '15%',
						zIndex: 0,
						opacity: 0.5,
						backgroundColor: '#222',
						transform: [
							{ scale: backCardScale },
							{ translateY: CARD_HEIGHT * 0.04 },
						],
					},
				]}
			>
				<Image source={dishes[nextIndex].image} style={[styles.dishImage, { borderRadius: 0, opacity: 0.7 }]} />
				<View style={styles.overlay} pointerEvents="none">
					<Text style={styles.dishTitle}>{dishes[nextIndex].title}</Text>
					<Text style={styles.likes}>{dishes[nextIndex].likes} Likes</Text>
				</View>
			</Animated.View>
			<Animated.View
				{...(cardExpanded ? {} : (panResponder.current && (panResponder.current as any).panHandlers))}
				style={[
					styles.card,
					{
						width: cardAnimWidthValue,
						height: cardAnimHeight,
						borderRadius: cardAnimBorderRadius,
						position: 'relative',
						zIndex: cardExpanded ? 100 : 1,
						left: cardExpanded ? 0 : undefined,
						transform: [
							{ translateX: cardExpanded ? 0 : position.x },
						],
					},
				]}
			>
				<TouchableWithoutFeedback onPress={cardExpanded ? undefined : openModal}>
					<View style={{ width: '100%', height: CARD_HEIGHT, overflow: 'hidden' }}>
						<Image source={dish.image} style={[styles.dishImage, { borderRadius: 0, height: CARD_HEIGHT }]} />
						<View style={styles.overlay} pointerEvents="none">
							<Text style={styles.dishTitle}>{dish.title}</Text>
							<Text style={styles.likes}>{dish.likes} Likes</Text>
						</View>
					</View>
				</TouchableWithoutFeedback>
				{cardExpanded && (
					<ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 24 }}>
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
				)}
				{cardExpanded && (
					<TouchableWithoutFeedback onPress={closeModal}>
						<View style={styles.closeIconContainerAbsolute}>
							<Text style={styles.closeIcon}>✕</Text>
						</View>
					</TouchableWithoutFeedback>
				)}
			</Animated.View>
			{showLeftIndicator && (
				<View style={styles.indicatorLeft} pointerEvents="none">
					<Text style={styles.indicatorText}>✗</Text>
				</View>
			)}
			{showRightIndicator && (
				<View style={styles.indicatorRight} pointerEvents="none">
					<Text style={styles.indicatorText}>✓</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		width: CARD_WIDTH,
		height: CARD_HEIGHT,
		backgroundColor: '#222',
		borderRadius: Math.round(CARD_WIDTH * 0.045),
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
		borderRadius: Math.round(CARD_WIDTH * 0.045),
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
		left: 0.08 * SCREEN_WIDTH, // 8% from left
		top: INDICATOR_OFFSET,
		height: INDICATOR_HEIGHT,
		width: INDICATOR_WIDTH,
		borderRadius: INDICATOR_WIDTH / 2,
		backgroundColor: 'rgba(255, 0, 0, 0)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	indicatorRight: {
		position: 'absolute',
		right: 0.08 * SCREEN_WIDTH, // 8% from right
		top: INDICATOR_OFFSET,
		height: INDICATOR_HEIGHT,
		width: INDICATOR_WIDTH,
		borderRadius: INDICATOR_WIDTH / 2,
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
