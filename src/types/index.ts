export interface FoodItem {
  id: string;
  name: string;
  default_unit: string;
  grams_per_unit: number;
  category: string;
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  fiber: number;
  vitamins: string;
  minerals: string;
  is_anti_inflammatory: boolean;
  anti_inflammatory_compounds: string[];
  dii_score: number;
}

export interface MealEntry {
  food: FoodItem;
  quantityGrams: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: number;
  date: string;
}

export interface PersonalProfileData {
  gender: "male" | "female" | "";
  age: number | "";
  height: number | ""; // cm
  weight: number | ""; // kg
  bodyFatPercentage: number | ""; // %
  bmr: number | ""; // Basal Metabolic Rate, kcal
  activeCalories: number | ""; // Active Calories, kcal
}

export interface PantryBatch {
  id: string;
  foodId: string;
  initialQuantityInUnits: number;
  initialWeightInGrams: number;
  calculatedGramsPerUnit: number;
  remainingQuantityInUnits: number; // 剩余可用的数量（单位）
  remainingWeightInGrams: number;   // 剩余可用的总重量（克）
  consumedQuantityInUnits: number; // 已消耗（吃掉）的数量（单位）
  consumedWeightInGrams: number;   // 已消耗（吃掉）的总重量（克）
  spoiledQuantityInUnits: number;  // 已变质（扔掉）的数量（单位）
  spoiledWeightInGrams: number;    // 已变质（扔掉）的总重量（克）
}

export const __type_exports = {};
