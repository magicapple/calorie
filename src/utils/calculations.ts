import type { PersonalProfileData } from '../types';
import type { MealEntry } from '../types';

// 计算基础代谢率 (BMR) - Mifflin-St Jeor Equation
export const calculateBMR = (profile: PersonalProfileData): number => {
  const { gender, weight, height, age } = profile;
  if (!weight || !height || !age) return 0;

  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);

  if (gender === 'male') {
    return (10 * w) + (6.25 * h) - (5 * a) + 5;
  } else if (gender === 'female') {
    return (10 * w) + (6.25 * h) - (5 * a) - 161;
  }
  return 0;
};

// 计算总摄入卡路里
export const calculateTotalIntake = (dailyMeals: MealEntry[]): {
  calories: number;
  protein: number;
  carbohydrate: number;
  fat: number;
} => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbohydrate = 0;
  let totalFat = 0;

  dailyMeals.forEach(meal => {
    const { food, quantityGrams } = meal;
    const ratio = quantityGrams / 100; // per 100g

    totalCalories += food.calories * ratio;
    totalProtein += food.protein * ratio;
    totalCarbohydrate += food.carbohydrate * ratio;
    totalFat += food.fat * ratio;
  });

  return {
    calories: totalCalories,
    protein: totalProtein,
    carbohydrate: totalCarbohydrate,
    fat: totalFat,
  };
};

// 计算宏量营养素供能比
export const calculateMacronutrientRatios = (protein: number, carbohydrate: number, fat: number) => {
  const proteinCalories = protein * 4; // 1g protein = 4 kcal
  const carbohydrateCalories = carbohydrate * 4; // 1g carb = 4 kcal
  const fatCalories = fat * 9; // 1g fat = 9 kcal
  const totalCalories = proteinCalories + carbohydrateCalories + fatCalories;

  if (totalCalories === 0) {
    return { proteinRatio: 0, carbohydrateRatio: 0, fatRatio: 0 };
  }

  return {
    proteinRatio: (proteinCalories / totalCalories) * 100,
    carbohydrateRatio: (carbohydrateCalories / totalCalories) * 100,
    fatRatio: (fatCalories / totalCalories) * 100,
  };
};

// 检查蛋白质摄入是否达标 (假设目标为 1.5g/kg 体重)
export const checkProteinTarget = (currentProtein: number, weight: number | '') => {
  if (!weight) return { status: '未知', target: 0 };
  const target = Number(weight) * 1.5;
  return { status: currentProtein >= target ? '达标' : '未达标', target: target };
};

// 统计抗炎食物比例
export const calculateAntiInflammatoryScore = (dailyMeals: MealEntry[]) => {
  let antiInflammatoryCount = 0;
  let totalFoodItems = 0;

  dailyMeals.forEach(meal => {
    totalFoodItems++;
    if (meal.food.is_anti_inflammatory) {
      antiInflammatoryCount++;
    }
  });

  if (totalFoodItems === 0) return 0;
  return (antiInflammatoryCount / totalFoodItems) * 100;
};
