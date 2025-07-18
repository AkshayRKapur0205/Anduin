import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, PanResponder, RefreshControl, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, useColorScheme, View } from 'react-native';
import ExpandedDishCard from '../components/ExpandedDishCard';
import FiltersBar from '../components/FiltersBar';
import SwipeIndicator from '../components/SwipeIndicator';
import { supabase } from '../supabaseClient';

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
	const colorScheme = useColorScheme && useColorScheme() || 'light';
	const [dishes, setDishes] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
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

	// Interpolated values for back card animation
	const backCardInterpolatedScale = position.x.interpolate({
		inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
		outputRange: [1, 0.85, 1],
		// Clamp so it doesn't overshoot
		extrapolate: 'clamp',
	});
	const backCardInterpolatedTranslateY = position.x.interpolate({
		inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
		outputRange: [0, CARD_HEIGHT * 0.04, 0],
		extrapolate: 'clamp',
	});

	// Helper to get the next dish index, returns -1 if only one dish left or at end
	const getNextIndex = (dir: 'left' | 'right') => {
		if (dishes.length === 0) return -1;
		if (dir === 'right') {
			return (currentIndex + 1) < dishes.length ? (currentIndex + 1) : -1;
		} else {
			return (currentIndex - 1) >= 0 ? (currentIndex - 1) : -1;
		}
	};

	const nextIndex = getNextIndex('right');
	const prevIndex = getNextIndex('left');
	const dish = dishes[currentIndex] || null;

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

	// Track if a tap occurred
	const tapStart = React.useRef<{ x: number; y: number } | null>(null);

	// Helper to save a recipe to local storage in the same format as the create page
	const saveRecipeToLocal = async (recipe: any) => {
		try {
			const existing = await AsyncStorage.getItem('privateRecipes');
			let recipes = existing ? JSON.parse(existing) : [];
			// Only check for duplicates by id
			if (!recipes.some((r: any) => r.id && recipe.id && r.id === recipe.id)) {
				const privateRecipe = {
					id: recipe.id || `private-${Date.now()}`,
					title: recipe.title,
					image: recipe.image,
					notes: recipe.notes || '',
					ingredients: recipe.ingredients,
					directions: recipe.directions,
					tags: recipe.tags || [],
					privacy: 'private',
					likes: recipe.likes || 0,
					created_at: recipe.created_at || new Date().toISOString(),
				};
				recipes.unshift(privateRecipe);
				await AsyncStorage.setItem('privateRecipes', JSON.stringify(recipes));
			}
		} catch (e) {
			console.error('Error saving recipe locally:', e);
		}
	};

	// PanResponder setup
	const panResponderInstance = React.useMemo(() => PanResponder.create({
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

			// Only allow swiping if there is a next card (not on the last card)
			if ((gesture.dx > 120 || gesture.dx < -120) && currentIndex < dishes.length - 1) {
				setSwipeIndicator(gesture.dx > 0 ? 'right' : 'left');
				Animated.timing(position, {
					toValue: { x: gesture.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
					duration: 200,
					useNativeDriver: false,
				}).start(async () => {
					position.setValue({ x: 0, y: 0 });
					// If swiped right, save to local in private format
					if (gesture.dx > 0) {
						await saveRecipeToLocal(dishes[currentIndex]);
					}
					setCurrentIndex((prev) => prev + 1);
					setTimeout(() => setSwipeIndicator(null), 400);
				});
			// If on the last card, allow swipe to go to 'no more dishes' state
			} else if ((gesture.dx > 120 || gesture.dx < -120) && currentIndex === dishes.length - 1) {
				setSwipeIndicator(gesture.dx > 0 ? 'right' : 'left');
				Animated.timing(position, {
					toValue: { x: gesture.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
					duration: 200,
					useNativeDriver: false,
				}).start(async () => {
					position.setValue({ x: 0, y: 0 });
					// If swiped right, save to local in private format
					if (gesture.dx > 0) {
						await saveRecipeToLocal(dishes[currentIndex]);
					}
					setCurrentIndex((prev) => prev + 1); // dish = null, triggers 'no more dishes' screen
					setTimeout(() => setSwipeIndicator(null), 400);
				});
			} else {
				Animated.spring(position, {
					toValue: { x: 0, y: 0 },
					useNativeDriver: false,
				}).start();
			}
		},
	}), [currentIndex, dishes.length]);

	// Helper to resolve image source
	const getImageSource = (image: string | undefined | null) => {
		const localImages: Record<string, any> = {
			'react-logo.png': require('@/assets/images/react-logo.png'),
			'partial-react-logo.png': require('@/assets/images/partial-react-logo.png'),
		};
		if (image && typeof image === 'string' && localImages[image]) {
			return localImages[image];
		}
		// If image is a non-empty string (e.g. a URL), use it directly
		if (image && typeof image === 'string' && image.trim() !== '') {
			return { uri: image };
		}
		// Use a default placeholder if image is missing, null, or not mapped
		return require('@/assets/images/react-logo.png');
	};

	// Helper to get a dish property with fallback
	const getDishProp = (dish: any, prop: string, fallback: any = 'Error: Not found') => {
		if (dish && dish[prop] !== undefined && dish[prop] !== null && dish[prop] !== '') {
			return dish[prop];
		}
		return fallback;
	};

	const [refreshing, setRefreshing] = useState(false);
	// Track filters in local state for display only
	const [filters, setFilters] = useState<string[]>([]);
	const [filtersMenuVisible, setFiltersMenuVisible] = useState(false);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			const { data, error } = await supabase.from('dishes').select('*');
			if (!error) {
				setDishes(data || []);
				setCurrentIndex(0);
			}
		} finally {
			setRefreshing(false);
		}
	};

	// Handler for FiltersBar
	const handleFiltersChange = (newFilters: string[]) => {
		setFilters(newFilters);
		// Optionally, trigger a filter on dishes here if needed
	};

	// Remove loadLocalRecipes and useFocusEffect for local recipes
	// Restore useEffect to fetch from Supabase
	useEffect(() => {
		setLoading(true);
		const fetchDishes = async () => {
			try {
				const { data, error } = await supabase.from('dishes').select('*');
				if (error) {
					setDishes([]);
				} else {
					setDishes(data || []);
				}
				setCurrentIndex(0);
			} catch (e) {
				setDishes([]);
			} finally {
				setLoading(false);
			}
		};
		fetchDishes();
	}, []);

	useEffect(() => {
		// Wake up backend on startup
		fetch('https://recipescraper-juts.onrender.com/', { method: 'GET' }).catch(() => {});
	}, []);

	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }}>
				<Text style={{ color: colorScheme === 'dark' ? '#fff' : '#222' }}>Loading dishes...</Text>
			</View>
		);
	}
	if (!dish) {
		return (
			<View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8' }}>
				<ScrollView
					contentContainerStyle={{ minHeight: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							colors={["#A1CEDC"]}
							tintColor="#A1CEDC"
							title="Pull to refresh..."
						/>
					}
				>
					<View style={{ alignItems: 'center', width: '100%' }}>
						<Text style={{ fontSize: 28, fontWeight: 'bold', color: '#A1CEDC', marginBottom: 16, textAlign: 'center' }}>No more dishes found</Text>
						<Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#888', fontSize: 16, marginBottom: 32, textAlign: 'center', paddingHorizontal: 16 }}>Pull down to refresh and see if new dishes are available!</Text>
						<View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E6F7FA', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#A1CEDC', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
							<Text style={{ fontSize: 40, color: '#A1CEDC' }}>↻</Text>
						</View>
						{/* Adjust Filters Button */}
						<View style={{ width: '100%', alignItems: 'center', marginTop: 8 }}>
							<TouchableWithoutFeedback onPress={() => setFiltersMenuVisible(true)}>
								<View style={{ backgroundColor: '#A1CEDC', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8, shadowColor: '#A1CEDC', shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 }}>
									<Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Adjust Filters</Text>
								</View>
							</TouchableWithoutFeedback>
						</View>
					</View>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181C20' : '#F5F6F8', paddingBottom: 0 }}>
			{/* Top Filters Bar - move only the bar down, not the card stack */}
			<View style={{ width: '100%', position: 'absolute', top: 64, left: 0, zIndex: 100, backgroundColor: 'transparent' }} pointerEvents="box-none">
				<FiltersBar onFiltersChange={handleFiltersChange} />
			</View>
			{/* Center the card stack vertically and horizontally */}
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				{/* Render the next card behind the current card, only if it exists */}
				{nextIndex !== -1 && dishes[nextIndex] && (
					<Animated.View
						pointerEvents="none"
						style={[
							styles.card,
							{
								width: cardAnimWidthValue, // match the current card's width animation
								height: cardAnimHeight, // match the current card's height animation
								borderRadius: cardAnimBorderRadius,
								position: 'absolute',
								left: '5%',
								top: '20%',
								zIndex: 0,
								opacity: 0.5,
								backgroundColor: '#222',
								transform: [
									{ scale: backCardInterpolatedScale },
									{ translateY: backCardInterpolatedTranslateY },
								],
							},
						]}
					>
						<Image source={getImageSource(dishes[nextIndex]?.image)} style={[styles.dishImage, { borderRadius: 0, opacity: 0.7 }]} />
						<View style={styles.overlay} pointerEvents="none">
							<Text style={styles.dishTitle}>{getDishProp(dishes[nextIndex], 'title', '')}</Text>
							<Text style={styles.likes}>{getDishProp(dishes[nextIndex], 'likes', '')} Likes</Text>
						</View>
					</Animated.View>
				)}
				{/* Render the current card, only if it exists */}
				{dish && (
					<Animated.View
						// Attach panHandlers only if card is not expanded and dish exists
						{...(!cardExpanded ? panResponderInstance.panHandlers : {})}
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
							{cardExpanded ? (
								<ExpandedDishCard dish={dish} onClose={closeModal} />
							) : (
								<View style={{ width: '100%', height: CARD_HEIGHT, overflow: 'hidden' }}>
									<Image source={getImageSource(dish?.image)} style={[styles.dishImage, { borderRadius: 0, height: CARD_HEIGHT }]} />
									<View style={styles.overlay} pointerEvents="none">
										<Text style={styles.dishTitle}>{getDishProp(dish, 'title', '')}</Text>
										<Text style={styles.likes}>{getDishProp(dish, 'likes', '')} Likes</Text>
									</View>
								</View>
							)}
						</TouchableWithoutFeedback>
					</Animated.View>
				)}
				<SwipeIndicator direction="left" visible={showLeftIndicator} />
				<SwipeIndicator direction="right" visible={showRightIndicator} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		width: CARD_WIDTH * 1.15,
		height: CARD_HEIGHT * 1.15,
		backgroundColor: '#222',
		borderRadius: Math.round(CARD_WIDTH * 0.045 * 1.15),
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 8 * 1.15,
		elevation: 4,
	},
	dishImage: {
		width: '100%',
		height: '100%',
		position: 'absolute',
		top: 0,
		left: 0,
		borderRadius: Math.round(CARD_WIDTH * 0.045 * 1.15),
	},
	overlay: {
		flex: 1,
		width: '100%',
		height: '100%',
		justifyContent: 'flex-end',
		alignItems: 'flex-start',
		padding: 24 * 1.15,
		backgroundColor: 'rgba(0,0,0,0.25)',
	},
	dishTitle: {
		fontSize: 28 * 1.15,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 8 * 1.15,
		textShadowColor: '#000',
		textShadowOffset: { width: 1 * 1.15, height: 1 * 1.15 },
		textShadowRadius: 4 * 1.15,
	},
	likes: {
		fontSize: 18 * 1.15,
		color: '#fff',
		fontWeight: '600',
		textShadowColor: '#000',
		textShadowOffset: { width: 1 * 1.15, height: 1 * 1.15 },
		textShadowRadius: 4 * 1.15,
		marginBottom: 12 * 1.15,
	},
	indicatorLeft: {
		position: 'absolute',
		left: 0.08 * SCREEN_WIDTH, // 8% from left
		top: INDICATOR_OFFSET,
		height: INDICATOR_HEIGHT * 1.15,
		width: INDICATOR_WIDTH * 1.15,
		borderRadius: (INDICATOR_WIDTH / 2) * 1.15,
		backgroundColor: 'rgba(255, 0, 0, 0)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	indicatorRight: {
		position: 'absolute',
		right: 0.08 * SCREEN_WIDTH, // 8% from right
		top: INDICATOR_OFFSET,
		height: INDICATOR_HEIGHT * 1.15,
		width: INDICATOR_WIDTH * 1.15,
		borderRadius: (INDICATOR_WIDTH / 2) * 1.15,
		backgroundColor: 'rgba(0, 200, 0, 0)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	indicatorText: {
		color: '#fff',
		fontSize: 32 * 1.15,
		fontWeight: 'bold',
	},
	fullscreenScroll: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.95)',
	},
	fullscreenScrollContent: {
		alignItems: 'center',
		paddingBottom: 40 * 1.15,
		paddingTop: 40 * 1.15,
	},
	fullscreenModalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.95)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 40 * 1.15,
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
		paddingBottom: 40 * 1.15,
		backgroundColor: 'rgba(0,0,0,0.85)',
		borderTopLeftRadius: 32 * 1.15,
		borderTopRightRadius: 32 * 1.15,
		marginTop: -32 * 1.15,
		paddingTop: 32 * 1.15,
		width: '100%',
		position: 'relative',
		zIndex: 1,
	},
	fullscreenTitle: {
		fontSize: 32 * 1.15,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 8 * 1.15,
		textAlign: 'center',
	},
	fullscreenAuthor: {
		color: '#A1CEDC',
		fontSize: 18 * 1.15,
		marginBottom: 8 * 1.15,
		textAlign: 'center',
	},
	fullscreenLikes: {
		color: '#fff',
		fontSize: 18 * 1.15,
		marginBottom: 16 * 1.15,
		textAlign: 'center',
	},
	fullscreenSection: {
		fontWeight: 'bold',
		color: '#A1CEDC',
		marginTop: 16 * 1.15,
		marginBottom: 4 * 1.15,
		fontSize: 20 * 1.15,
		alignSelf: 'flex-start',
	},
	fullscreenText: {
		color: '#fff',
		fontSize: 16 * 1.15,
		alignSelf: 'flex-start',
		marginBottom: 2 * 1.15,
		marginLeft: 8 * 1.15,
	},
	closeModal: {
		color: '#A1CEDC',
		fontWeight: 'bold',
		fontSize: 20 * 1.15,
		marginTop: 32 * 1.15,
		alignSelf: 'center',
		textDecorationLine: 'underline',
		marginBottom: 40 * 1.15,
	},
	closeIconContainer: {
		position: 'absolute',
		top: 40 * 1.15,
		right: 20 * 1.15,
		zIndex: 10,
	},
	closeIconContainerAbsolute: {
		position: 'absolute',
		top: 64 * 1.15,
		right: 20 * 1.15,
		zIndex: 1000,
		backgroundColor: 'rgba(0,0,0,0.3)',
		borderRadius: 20 * 1.15,
		padding: 4 * 1.15,
	},
	closeIcon: {
		color: '#A1CEDC',
		fontSize: 28 * 1.15,
		fontWeight: 'bold',
	},
	infoSection: {
		flex: 1,
		width: '100%',
		backgroundColor: '#fff',
		borderTopLeftRadius: 24 * 1.15,
		borderTopRightRadius: 24 * 1.15,
		marginTop: -24 * 1.15,
		paddingTop: 32 * 1.15,
	},
	infoSectionStatic: {
		width: '100%',
		backgroundColor: '#fff',
		borderTopLeftRadius: 24 * 1.15,
		borderTopRightRadius: 24 * 1.15,
		marginTop: -24 * 1.15,
		paddingTop: 32 * 1.15,
		paddingHorizontal: 24 * 1.15,
		paddingBottom: 40 * 1.15,
	},
	infoSectionContent: {
		paddingHorizontal: 24 * 1.15,
		paddingBottom: 40 * 1.15,
	},
	infoSectionTitle: {
		fontWeight: 'bold',
		color: '#222',
		fontSize: 20 * 1.15,
		marginTop: 16 * 1.15,
		marginBottom: 4 * 1.15,
	},
	infoSectionText: {
		color: '#222',
		fontSize: 16 * 1.15,
		marginBottom: 2 * 1.15,
		marginLeft: 8 * 1.15,
	},
});