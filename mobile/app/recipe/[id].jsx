import { View, Text, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { API_URL } from "../../constants/api";
import { MealAPI } from "../../services/mealAPI";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Image } from "expo-image";
import { recipeDetailStyles } from "../../assets/styles/recipe-detail.styles";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { Swipeable } from "react-native-gesture-handler";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RectButton } from 'react-native-gesture-handler';
import { Animated, Easing } from "react-native";
import { StyleSheet } from "react-native";

const RecipeDetailScreen = () => {
  const { id: recipeId } = useLocalSearchParams();
  const router = useRouter();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [checkedInstructions, setCheckedInstructions] = useState([]);
  const [doneAnimating, setDoneAnimating] = useState({});
  const swipeableRefs = useRef({});
  const slideAnims = useRef({});

  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const response = await fetch(`${API_URL}/favorites/${userId}`);
        const favorites = await response.json();
        const isRecipeSaved = favorites.some((fav) => fav.recipeId === parseInt(recipeId));
        setIsSaved(isRecipeSaved);
      } catch (error) {
        console.error("Error checking if recipe is saved:", error);
      }
    };

    const loadRecipeDetail = async () => {
      setLoading(true);
      try {
        const mealData = await MealAPI.getMealById(recipeId);
        if (mealData) {
          const transformedRecipe = MealAPI.transformMealData(mealData);

          const recipeWithVideo = {
            ...transformedRecipe,
            youtubeUrl: mealData.strYoutube || null,
          };

          setRecipe(recipeWithVideo);
        }
      } catch (error) {
        console.error("Error loading recipe detail:", error);
      } finally {
        setLoading(false);
      }
    };

    checkIfSaved();
    loadRecipeDetail();
    setCheckedIngredients([]);
    setCheckedInstructions([]);
  }, [recipeId, userId]);

  const getYouTubeEmbedUrl = (url) => {
    // example url: https://www.youtube.com/watch?v=mTvlmY4vCug
    const videoId = url.split("v=")[1];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleToggleSave = async () => {
    setIsSaving(true);

    try {
      if (isSaved) {
        // remove from favorites
        const response = await fetch(`${API_URL}/favorites/${userId}/${recipeId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to remove recipe");

        setIsSaved(false);
      } else {
        // add to favorites
        const response = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            recipeId: parseInt(recipeId),
            title: recipe.title,
            image: recipe.image,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
          }),
        });

        if (!response.ok) throw new Error("Failed to save recipe");
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling recipe save:", error);
      Alert.alert("Error", `Something went wrong. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleIngredient = (index) => {
    setCheckedIngredients((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleToggleInstruction = (index) => {
    setCheckedInstructions((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSwipeDone = (index) => {
    setCheckedIngredients((prev) => [...prev, index]);
    setDoneAnimating((prev) => ({ ...prev, [index]: true }));
    Animated.timing(slideAnims.current[index], {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      setDoneAnimating((prev) => ({ ...prev, [index]: false }));
      if (swipeableRefs.current[index]) {
        swipeableRefs.current[index].close();
      }
    }, 1000);
  };

  const handleCancel = (index) => {
    setCheckedIngredients((prev) => prev.filter((i) => i !== index));
    setDoneAnimating((prev) => ({ ...prev, [index]: false }));
    if (swipeableRefs.current[index]) {
      swipeableRefs.current[index].close();
    }
  };

  if (loading) return <LoadingSpinner message="Loading recipe details..." />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={recipeDetailStyles.container}>
        <ScrollView>
          {/* HEADER */}
          <View style={recipeDetailStyles.headerContainer}>
            <View style={recipeDetailStyles.imageContainer}>
              <Image
                source={{ uri: recipe.image }}
                style={recipeDetailStyles.headerImage}
                contentFit="cover"
              />
            </View>

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
              style={recipeDetailStyles.gradientOverlay}
            />

            <View style={recipeDetailStyles.floatingButtons}>
              <TouchableOpacity
                style={recipeDetailStyles.floatingButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  recipeDetailStyles.floatingButton,
                  { backgroundColor: isSaving ? COLORS.gray : COLORS.primary },
                ]}
                onPress={handleToggleSave}
                disabled={isSaving}
              >
                <Ionicons
                  name={isSaving ? "hourglass" : isSaved ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>

            {/* Title Section */}
            <View style={recipeDetailStyles.titleSection}>
              <View style={recipeDetailStyles.categoryBadge}>
                <Text style={recipeDetailStyles.categoryText}>{recipe.category}</Text>
              </View>
              <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>
              {recipe.area && (
                <View style={recipeDetailStyles.locationRow}>
                  <Ionicons name="location" size={16} color={COLORS.white} />
                  <Text style={recipeDetailStyles.locationText}>{recipe.area} Cuisine</Text>
                </View>
              )}
            </View>
          </View>

          <View style={recipeDetailStyles.contentSection}>
            {/* QUICK STATS */}
            <View style={recipeDetailStyles.statsContainer}>
              <View style={recipeDetailStyles.statCard}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E53"]}
                  style={recipeDetailStyles.statIconContainer}
                >
                  <Ionicons name="time" size={20} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.statValue}>{recipe.cookTime}</Text>
                <Text style={recipeDetailStyles.statLabel}>Prep Time</Text>
              </View>

              <View style={recipeDetailStyles.statCard}>
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={recipeDetailStyles.statIconContainer}
                >
                  <Ionicons name="people" size={20} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.statValue}>{recipe.servings}</Text>
                <Text style={recipeDetailStyles.statLabel}>Servings</Text>
              </View>
            </View>

            {recipe.youtubeUrl && (
              <View style={recipeDetailStyles.sectionContainer}>
                <View style={recipeDetailStyles.sectionTitleRow}>
                  <LinearGradient
                    colors={["#FF0000", "#CC0000"]}
                    style={recipeDetailStyles.sectionIcon}
                  >
                    <Ionicons name="play" size={16} color={COLORS.white} />
                  </LinearGradient>

                  <Text style={recipeDetailStyles.sectionTitle}>Video Tutorial</Text>
                </View>

                <View style={recipeDetailStyles.videoCard}>
                  <WebView
                    style={recipeDetailStyles.webview}
                    source={{ uri: getYouTubeEmbedUrl(recipe.youtubeUrl) }}
                    allowsFullscreenVideo
                    mediaPlaybackRequiresUserAction={false}
                  />
                </View>
              </View>
            )}

            {/* INGREDIENTS SECTION */}
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primary + "80"]}
                  style={recipeDetailStyles.sectionIcon}
                >
                  <Ionicons name="list" size={16} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.sectionTitle}>Ingredients</Text>
                <View style={recipeDetailStyles.countBadge}>
                  <Text style={recipeDetailStyles.countText}>{recipe.ingredients.length}</Text>
                </View>
              </View>

              <View style={recipeDetailStyles.ingredientsGrid}>
                {recipe.ingredients.map((ingredient, index) => {
                  const checked = checkedIngredients.includes(index);

                  // Initialize animation value for this index if not present
                  if (!slideAnims.current[index]) {
                    slideAnims.current[index] = new Animated.Value(300);
                  }
                  const slideAnim = slideAnims.current[index];

                  const renderLeftActions = (progress, dragX) => (
                    <LinearGradient
                      colors={['#43e97b', '#38f9d7']}
                      start={[0, 0]}
                      end={[1, 1]}
                      style={{
                        flex: 1,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                      }}
                    >
                      <Animated.View
                        style={{
                          backgroundColor: '#fff',
                          borderRadius: 32,
                          width: 48,
                          height: 48,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 18,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 4,
                          elevation: 4,
                          opacity: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        }}
                      >
                        <Ionicons name="checkmark" size={32} color="#43e97b" />
                      </Animated.View>
                      <Animated.Text
                        style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: 24,
                          letterSpacing: 1,
                          opacity: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        }}
                      >
                        Completed! 🎉
                      </Animated.Text>
                    </LinearGradient>
                  );

                  return (
                    <Swipeable
                      key={index}
                      ref={ref => (swipeableRefs.current[index] = ref)}
                      renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX)}
                      overshootLeft={false}
                      onSwipeableOpen={() => {
                        if (!checked) {
                          handleSwipeDone(index);
                        }
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          recipeDetailStyles.ingredientCard,
                          checked && { borderColor: "#27ae60", borderWidth: 2 }
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleToggleIngredient(index)}
                      >
                        <View style={recipeDetailStyles.ingredientNumber}>
                          <Text style={recipeDetailStyles.ingredientNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={recipeDetailStyles.ingredientText}>{ingredient}</Text>
                        <View style={recipeDetailStyles.ingredientCheck}>
                          <Ionicons
                            name={checked ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={24}
                            color={checked ? "#27ae60" : "#bbb"}
                          />
                        </View>
                        {doneAnimating[index] && (
                          <Animated.View
                            style={[
                              StyleSheet.absoluteFill,
                              {
                                backgroundColor: "#27ae60",
                                borderRadius: 16,
                                zIndex: 2,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: [{ translateX: slideAnim }],
                              }
                            ]}
                          >
                            <Ionicons name="checkmark-circle" size={40} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 24, marginLeft: 16 }}>
                              Done
                            </Text>
                            <TouchableOpacity
                              style={{
                                marginLeft: 32,
                                backgroundColor: "#fff",
                                borderRadius: 20,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                              }}
                              onPress={() => handleCancel(index)}
                            >
                              <Text style={{ color: "#27ae60", fontWeight: "bold", fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </Swipeable>
                  );
                })}
              </View>
            </View>

            {/* INSTRUCTIONS SECTION */}
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient
                  colors={["#9C27B0", "#673AB7"]}
                  style={recipeDetailStyles.sectionIcon}
                >
                  <Ionicons name="book" size={16} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.sectionTitle}>Instructions</Text>
                <View style={recipeDetailStyles.countBadge}>
                  <Text style={recipeDetailStyles.countText}>{recipe.instructions.length}</Text>
                </View>
              </View>

              <View style={recipeDetailStyles.instructionsContainer}>
                {recipe.instructions.map((instruction, index) => (
                  <View key={index} style={recipeDetailStyles.instructionCard}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primary + "CC"]}
                      style={recipeDetailStyles.stepIndicator}
                    >
                      <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                    </LinearGradient>
                    <View style={recipeDetailStyles.instructionContent}>
                      <Text style={recipeDetailStyles.instructionText}>{instruction}</Text>
                      <View style={recipeDetailStyles.instructionFooter}>
                        <Text style={recipeDetailStyles.stepLabel}>Step {index + 1}</Text>
                        <TouchableOpacity
                          style={recipeDetailStyles.completeButton}
                          activeOpacity={0.7}
                          onPress={() => handleToggleInstruction(index)}
                        >
                          <Ionicons
                            name={checkedInstructions.includes(index) ? "checkmark-circle" : "checkmark-circle-outline"}
                            size={20}
                            color={checkedInstructions.includes(index) ? COLORS.primary : COLORS.textLight}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={recipeDetailStyles.primaryButton}
              onPress={handleToggleSave}
              disabled={isSaving}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primary + "CC"]}
                style={recipeDetailStyles.buttonGradient}
              >
                <Ionicons name="heart" size={20} color={COLORS.white} />
                <Text style={recipeDetailStyles.buttonText}>
                  {isSaved ? "Remove from Favorites" : "Add to Favorites"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};

export default RecipeDetailScreen;