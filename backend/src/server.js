import express from "express";
import { ENV } from "./config/env.js";
import { favoritesTable } from "./db/schema.js";
import { and, eq } from "drizzle-orm";
import { db } from "./config/db.js"
import job from "./config/cron.js";
import cors from "cors";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.select().from(favoritesTable).limit(1);
    res.status(200).json({ success: true, message: "Database connection working", count: result.length });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/favorites", async (req, res) => {
  console.log("POST /api/favorites - Request body:", req.body);
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    if (!userId || !recipeId || !title) {
      console.log("Missing required fields:", { userId, recipeId, title });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings,
      })
      .returning();

    console.log("Successfully added favorite:", newFavorite[0]);
    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log("Error adding favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  console.log("GET /api/favorites/:userId - userId:", req.params.userId);
  try {
    const { userId } = req.params;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    console.log("Found favorites for user:", userFavorites);
    res.status(200).json(userFavorites);
  } catch (error) {
    console.log("Error fetching the favorites", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  console.log("DELETE /api/favorites/:userId/:recipeId - userId:", req.params.userId, "recipeId:", req.params.recipeId);
  try {
    const { userId, recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(eq(favoritesTable.userId, userId), eq(favoritesTable.recipeId, parseInt(recipeId)))
      );

    console.log("Successfully deleted favorite");
    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on PORT:", PORT);
});