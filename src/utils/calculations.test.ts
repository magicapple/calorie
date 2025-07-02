import { describe, it, expect } from "vitest";
import {
  calculateBMR,
  calculateTotalIntake,
  calculateMacronutrientRatios,
  checkProteinTarget,
  calculateAntiInflammatoryScore,
} from "./calculations";
import type { PersonalProfileData, MealEntry } from "../types";

describe("calculateBMR", () => {
  it("should calculate BMR correctly for male", () => {
    const profile: PersonalProfileData = {
      gender: "male",
      weight: 70,
      height: 175,
      age: 30,
      activityLevel: "sedentary",
      goal: "maintain",
    };
    expect(calculateBMR(profile)).toBeCloseTo(1648.75);
  });

  it("should calculate BMR correctly for female", () => {
    const profile: PersonalProfileData = {
      gender: "female",
      weight: 60,
      height: 165,
      age: 25,
      activityLevel: "sedentary",
      goal: "maintain",
    };
    expect(calculateBMR(profile)).toBeCloseTo(1345.25);
  });

  it("should return 0 if weight, height or age is missing", () => {
    const profile: PersonalProfileData = {
      gender: "male",
      weight: 70,
      height: 175,
      age: undefined,
      activityLevel: "sedentary",
      goal: "maintain",
    };
    expect(calculateBMR(profile)).toBe(0);
  });
});

describe("calculateTotalIntake", () => {
  it("should calculate total calories and macronutrients correctly", () => {
    const dailyMeals: MealEntry[] = [
      {
        id: "1",
        food: {
          id: "food1",
          name: "Chicken Breast",
          calories: 165,
          protein: 31,
          carbohydrate: 0,
          fat: 3.6,
          is_anti_inflammatory: false,
        },
        quantityGrams: 150,
      },
      {
        id: "2",
        food: {
          id: "food2",
          name: "Rice",
          calories: 130,
          protein: 2.7,
          carbohydrate: 28,
          fat: 0.3,
          is_anti_inflammatory: false,
        },
        quantityGrams: 200,
      },
    ];
    const result = calculateTotalIntake(dailyMeals);
    expect(result.calories).toBeCloseTo(165 * 1.5 + 130 * 2);
    expect(result.protein).toBeCloseTo(31 * 1.5 + 2.7 * 2);
    expect(result.carbohydrate).toBeCloseTo(0 * 1.5 + 28 * 2);
    expect(result.fat).toBeCloseTo(3.6 * 1.5 + 0.3 * 2);
  });

  it("should return zero for empty meal list", () => {
    const dailyMeals: MealEntry[] = [];
    const result = calculateTotalIntake(dailyMeals);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.carbohydrate).toBe(0);
    expect(result.fat).toBe(0);
  });
});

describe("calculateMacronutrientRatios", () => {
  it("should calculate macronutrient ratios correctly", () => {
    const protein = 50;
    const carbohydrate = 100;
    const fat = 20;
    const result = calculateMacronutrientRatios(protein, carbohydrate, fat);
    const totalCalories = 50 * 4 + 100 * 4 + 20 * 9;
    expect(result.proteinRatio).toBeCloseTo(((50 * 4) / totalCalories) * 100);
    expect(result.carbohydrateRatio).toBeCloseTo(
      ((100 * 4) / totalCalories) * 100
    );
    expect(result.fatRatio).toBeCloseTo(((20 * 9) / totalCalories) * 100);
  });

  it("should return zero ratios if total calories is zero", () => {
    const result = calculateMacronutrientRatios(0, 0, 0);
    expect(result.proteinRatio).toBe(0);
    expect(result.carbohydrateRatio).toBe(0);
    expect(result.fatRatio).toBe(0);
  });
});

describe("checkProteinTarget", () => {
  it('should return "达标" if current protein meets target', () => {
    const result = checkProteinTarget(120, 70); // target = 70 * 1.5 = 105
    expect(result.status).toBe("达标");
    expect(result.target).toBe(105);
  });

  it('should return "未达标" if current protein is below target', () => {
    const result = checkProteinTarget(80, 70); // target = 70 * 1.5 = 105
    expect(result.status).toBe("未达标");
    expect(result.target).toBe(105);
  });

  it('should return "未知" if weight is missing', () => {
    const result = checkProteinTarget(80, "");
    expect(result.status).toBe("未知");
    expect(result.target).toBe(0);
  });
});

describe("calculateAntiInflammatoryScore", () => {
  it("should calculate anti-inflammatory score correctly", () => {
    const dailyMeals: MealEntry[] = [
      {
        id: "1",
        food: {
          id: "food1",
          name: "Salmon",
          calories: 200,
          protein: 20,
          carbohydrate: 0,
          fat: 13,
          is_anti_inflammatory: true,
        },
        quantityGrams: 100,
      },
      {
        id: "2",
        food: {
          id: "food2",
          name: "Broccoli",
          calories: 55,
          protein: 3.7,
          carbohydrate: 11.2,
          fat: 0.6,
          is_anti_inflammatory: true,
        },
        quantityGrams: 150,
      },
      {
        id: "3",
        food: {
          id: "food3",
          name: "White Bread",
          calories: 265,
          protein: 9,
          carbohydrate: 49,
          fat: 3.2,
          is_anti_inflammatory: false,
        },
        quantityGrams: 50,
      },
    ];
    const result = calculateAntiInflammatoryScore(dailyMeals);
    expect(result).toBeCloseTo((2 / 3) * 100);
  });

  it("should return 0 if no food items", () => {
    const dailyMeals: MealEntry[] = [];
    const result = calculateAntiInflammatoryScore(dailyMeals);
    expect(result).toBe(0);
  });
});
