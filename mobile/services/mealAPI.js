const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export const MealAPI = { 
  searchMealsByName: async (query) => { 
    try {
      const response = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.meals;
    } catch (error) {
      console.error("Error searching meals:", error);
      return []; 
    }
  },

  getMealById: async (id) => { 
    try {
      const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
      const data = await response.json();
      return data.meals[0];
    } catch (error) {
      console.error("Error fetching meal details:", error);
      return null;
    }
  },

  getRandomMeal: async () => { 
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json(); 
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting random meals:", error);
    }
  },

  getRandomMeals: async (count = 6) => { 
    try {
      const promises = Array(count) 
      .fill(null)
      .map(() => MealAPI.getRandomMeal());
      const meals = await Promise.all(promises);
      return meals.filter(meal => meal !== null);
    } catch (error) {
      console.error("Error getting random meals:", error);
      return [];
    }
  },

  getCategories: async () => { 
    try {
      const response = await fetch(`${BASE_URL}/categories.php`);
      const data = await response.json();
      return data.categories;
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  },

  filterByIngredient: async (ingredient) => { 
    try {
      const response = await fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by ingredient:", error);
      return [];
    }
  },

  filterByCategory: async (category) => { 
    try {
      const response = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
      const data = await response.json();
      return data.meals || [];
    } catch (error) {
      console.error("Error filtering by ingredient:", error);
      return [];
    }
  },

  
  transformMealData: (meal) => {
    if (!meal) return null;

    // extract ingredients from the meal object
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const measureText = measure && measure.trim() ? `${measure.trim()} ` : "";
        ingredients.push(`${measureText}${ingredient.trim()}`);
      }
    }

    // extract instructions
    const instructions = meal.strInstructions
      ? meal.strInstructions.split(/\r?\n/).filter((step) => step.trim())
      : [];

    // Try to estimate servings and cookTime from tags or instructions
    let servings = 4;
    let cookTime = "30 minutes";
    // Try to parse servings from tags (e.g., "serves-2")
    if (meal.strTags) {
      const match = meal.strTags.match(/serves?-?(\d+)/i);
      if (match) {
        servings = parseInt(match[1], 10);
      }
    }
    // Try to parse cookTime from tags (e.g., "45min")
    if (meal.strTags) {
      const match = meal.strTags.match(/(\d+)(min|minutes|hour|hr)/i);
      if (match) {
        cookTime = match[0];
      }
    }
    // Optionally, try to parse from instructions (very basic)
    if (instructions.length > 0) {
      const match = instructions[0].match(/(\d+)(min|minutes|hour|hr)/i);
      if (match) {
        cookTime = match[0];
      }
    }

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strInstructions
        ? meal.strInstructions.substring(0, 120) + "..."
        : "Delicious meal from TheMealDB",
      image: meal.strMealThumb,
      cookTime,
      servings,
      category: meal.strCategory || "Main Course",
      area: meal.strArea,
      ingredients,
      instructions,
      originalData: meal,
    };
  },
}