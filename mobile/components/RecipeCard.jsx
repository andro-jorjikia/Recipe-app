import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { recipeCardStyles,  homeStyles} from "../assets/styles/home.styles";

const RecipeCard = ({ recipe }) => {
  const router = useRouter();
  if (!recipe) return null;
  return (
    <TouchableOpacity
      style={recipeCardStyles.container}
      activeOpacity={0.85}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View style={recipeCardStyles.imageContainer}>
        <Image
          source={{ uri: recipe.image }}
          style={recipeCardStyles.image}
          contentFit="cover"
          transition={300}
        />
      </View>
      <View style={recipeCardStyles.content}>
        <Text style={recipeCardStyles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
        <Text style={recipeCardStyles.description} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={recipeCardStyles.footer}>
          <View style={recipeCardStyles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={recipeCardStyles.timeText}>{recipe.cookTime}</Text>
          </View>
          <View style={recipeCardStyles.servingsContainer}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={recipeCardStyles.servingsText}>{recipe.servings}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RecipeCard; 