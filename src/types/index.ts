export interface FoodItem {
  id: string;
  name: string;
  default_unit: string;
  
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
  id: string; // Use timestamp as a unique ID
  food: FoodItem;
  quantityGrams: number;
  quantityUnits: number;
  unit: "grams" | "units";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: number;
  date: string;
  pantryDeductions: {
    batchId: string;
    consumedUnits: number;
    consumedGrams: number;
  }[];
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

export interface PersonalProfileHistoryEntry {
  timestamp: number; // 档案更新时的 Unix 时间戳
  date: string;      // 档案更新时的日期 (YYYY-MM-DD 格式)
  profileData: PersonalProfileData; // 当时的个人档案数据
}

export interface RecentFoodEntry {
  id: string; // 唯一ID，例如 `${mealType}_${foodId}` 或一个时间戳
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodId: string;
  quantity: number; // 最近使用的数量
  unit: "grams" | "units"; // 最近使用的单位
  lastUsed: number; // 最近使用的时间戳
}

export const __type_exports = {};
