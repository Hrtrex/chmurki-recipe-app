import express from "express";
import cors from "cors";
import "dotenv/config";
import * as RecipeAPI from "./recipe-api";
import { PrismaClient } from "@prisma/client";
import path from "path";

const app = express();
const prismaClient = new PrismaClient();

// azure port
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, './dist')));
// serwowanie frontendu
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './dist/index.html'));
});

// enpoint wyszukiwanie przepisów ze spoonacular API
app.get("/api/recipes/search", async (req, res) => {
  const searchTerm = req.query.searchTerm as string;
  const page = parseInt(req.query.page as string);
  const results = await RecipeAPI.searchRecipes(searchTerm, page);

  return res.json(results);
});
// endpoint szczegóły przepisu (po kliknięciu)
app.get("/api/recipes/:recipeId/summary", async (req, res) => {
  const recipeId = req.params.recipeId;
  const results = await RecipeAPI.getRecipeSummary(recipeId);
  return res.json(results);
});
// endpoint dodanie ulubionego przepisu do bazy danych
app.post("/api/recipes/favourite", async (req, res) => {
  const recipeId = req.body.recipeId;

  try {
    const favouriteRecipe = await prismaClient.favouriteRecipes.create({
      data: {
        recipeId: recipeId,
      },
    });
    return res.status(201).json(favouriteRecipe);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Oops, something went wrong" });
  }
});
// pobranie ulubionych przepisów z bazy danych
app.get("/api/recipes/favourite", async (req, res) => {
  try {
    const recipes = await prismaClient.favouriteRecipes.findMany();
    const recipeIds = recipes.map((recipe) => recipe.recipeId.toString());

    const favourites = await RecipeAPI.getFavouriteRecipesByIDs(recipeIds);

    return res.json(favourites);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Oops, something went wrong" });
  }
});
// usunięcie ulubionego przepisu z bazy danych
app.delete("/api/recipes/favourite", async (req, res) => {
  const recipeId = req.body.recipeId;

  try {
    await prismaClient.favouriteRecipes.delete({
      where: {
        recipeId: recipeId,
      },
    });
    return res.status(204).send();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Oops, something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`server running on localhost:${port}`);
});
