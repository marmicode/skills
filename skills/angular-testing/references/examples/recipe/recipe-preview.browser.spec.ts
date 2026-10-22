import { inputBinding, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { page } from "vitest/browser";
import { recipeMother } from "../testing/recipe.mother";
import { RecipePreview } from "./recipe-preview.ng";

describe(RecipePreview, () => {
  it("shows recipe name", async () => {
    const { recipeName } = mountRecipePreview();

    await expect.element(recipeName).toHaveTextContent("Burger");
  });

  it("shows the new recipe when the input changes", async () => {
    const { recipe, recipeName } = mountRecipePreview();

    recipe.set(recipeMother.withBasicInfo("Salad").build());

    await expect.element(recipeName).toHaveTextContent("Salad");
  });

  function mountRecipePreview() {
    /* The signal drives the input: tests change the input with `recipe.set(...)`. */
    const recipe = signal(recipeMother.withBasicInfo("Burger").build());

    TestBed.createComponent(RecipePreview, {
      bindings: [inputBinding("recipe", recipe)],
    });

    return {
      recipe,
      recipeName: page.getByRole("heading"),
    };
  }
});
