import React, { useState, useEffect } from "react";
import {
  addData,
  getAllData,
  updateData,
  deleteData,
  getByIndex,
  getData,
} from "../lib/indexedDB";
import type {
  FoodItem,
  MealEntry,
  PantryBatch,
  RecentFoodEntry,
} from "../types";
import { foodDatabase } from "../data/foodDatabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // Import Button
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react"; // Import X icon
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const foodCategories = [
  "所有类别",
  ...new Set(foodDatabase.map((food) => food.category)),
];

const DailyMealLogger: React.FC = () => {
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number | "">("");
  const [inputUnit, setInputUnit] = useState<"grams" | "units">("grams");
  const [inputGrams, setInputGrams] = useState<number | "">("");
  const [selectedCategory, setSelectedCategory] = useState<string>("所有类别");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyMeals, setDailyMeals] = useState<MealEntry[]>([]);
  const [pantry, setPantry] = useState<PantryBatch[]>([]);
  const [recentFoods, setRecentFoods] = useState<RecentFoodEntry[]>([]);

  useEffect(() => {
    if (selectedFood && inputUnit === "units" && inputQuantity !== "") {
      const quantity = Number(inputQuantity);
      const relevantBatches = pantry.filter(
        (batch) =>
          batch.foodId === selectedFood.id && batch.remainingQuantityInUnits > 0
      );

      if (relevantBatches.length > 0) {
        const totalGrams = relevantBatches.reduce(
          (sum, batch) => sum + batch.initialWeightInGrams,
          0
        );
        const totalUnits = relevantBatches.reduce(
          (sum, batch) => sum + batch.initialQuantityInUnits,
          0
        );
        const averageGramsPerUnit =
          totalUnits > 0 ? totalGrams / totalUnits : 0;

        setInputGrams(
          parseFloat((quantity * averageGramsPerUnit).toFixed(2))
        );
      } else {
        setInputGrams("");
      }
    } else {
      setInputGrams("");
    }
  }, [selectedFood, inputQuantity, inputUnit, pantry]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // --- One-time data migration for meal entries ---
        const migrationKey = 'meal-id-migration-v1-done';
        const migrationDone = localStorage.getItem(migrationKey);

        if (!migrationDone) {
          console.log("Running one-time meal ID migration...");
          const allMeals = await getAllData<MealEntry>('mealEntries');
          let migrationCount = 0;
          for (const meal of allMeals) {
            if (!meal.id || typeof meal.id !== 'string') {
              meal.id = meal.timestamp.toString();
              // Ensure pantryDeductions exists to match the new type
              if (!meal.pantryDeductions) {
                meal.pantryDeductions = [];
              }
              await updateData('mealEntries', meal);
              migrationCount++;
            }
          }
          if (migrationCount > 0) {
            console.log(`Migration complete. Updated ${migrationCount} meal entries.`);
          } else {
            console.log("No meal entries needed migration.");
          }
          localStorage.setItem(migrationKey, 'true');
        }

        // Now, load the data for the selected date
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const meals = await getByIndex<MealEntry>(
          "mealEntries",
          "dateIndex",
          dateString
        );
        setDailyMeals(meals);

        const loadedPantry = await getAllData<PantryBatch>("pantryBatches");
        setPantry(loadedPantry);

        const recent = await getByIndex<RecentFoodEntry>(
          "recentFoods",
          "mealTypeIndex",
          mealType
        );
        setRecentFoods(recent.sort((a, b) => b.lastUsed - a.lastUsed));
      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
      }
    };
    loadData();
  }, [selectedDate, mealType]);

  const availableFoodsInPantry = React.useMemo(() => {
    const availableFoodIds = new Set<string>();
    pantry.forEach((batch) => {
      if (batch.remainingQuantityInUnits > 0) {
        availableFoodIds.add(batch.foodId);
      }
    });

    let foods = Array.from(availableFoodIds)
      .map((foodId) => foodDatabase.find((f) => f.id === foodId))
      .filter(Boolean) as FoodItem[];

    if (selectedCategory !== "所有类别") {
      foods = foods.filter((food) => food.category === selectedCategory);
    }

    return foods;
  }, [pantry, selectedCategory]);

  const handleAddMeal = async () => {
    if (!selectedFood) return;

    let quantityToConsumeUnits: number;
    let totalGramsConsumed: number;

    if (inputUnit === "grams") {
      if (inputQuantity === "") return;
      quantityToConsumeUnits = Number(inputQuantity);
      totalGramsConsumed = Number(inputQuantity);
    } else {
      if (inputQuantity === "" || inputGrams === "") return;
      quantityToConsumeUnits = Number(inputQuantity);
      totalGramsConsumed = Number(inputGrams);
    }

    let remainingQuantityToConsumeUnits = quantityToConsumeUnits;

    try {
      const updatedPantry = [...pantry];
      const batchesToUpdate: PantryBatch[] = [];
      const pantryDeductions: {
        batchId: string;
        consumedUnits: number;
        consumedGrams: number;
      }[] = [];

      const sortedBatches = updatedPantry
        .filter(
          (batch) =>
            batch.foodId === selectedFood.id &&
            batch.remainingQuantityInUnits > 0
        )
        .sort((a, b) => Number(a.id) - Number(b.id));

      for (const batch of sortedBatches) {
        if (remainingQuantityToConsumeUnits <= 0) break;

        const consumeFromThisBatchUnits = Math.min(
          remainingQuantityToConsumeUnits,
          batch.remainingQuantityInUnits
        );
        const consumeFromThisBatchGrams =
          consumeFromThisBatchUnits * batch.calculatedGramsPerUnit;

        batch.remainingQuantityInUnits -= consumeFromThisBatchUnits;
        batch.remainingWeightInGrams -= consumeFromThisBatchGrams;
        batch.consumedQuantityInUnits += consumeFromThisBatchUnits;
        batch.consumedWeightInGrams += consumeFromThisBatchGrams;

        remainingQuantityToConsumeUnits -= consumeFromThisBatchUnits;

        batchesToUpdate.push(batch);
        pantryDeductions.push({
          batchId: batch.id,
          consumedUnits: consumeFromThisBatchUnits,
          consumedGrams: consumeFromThisBatchGrams,
        });
      }

      if (remainingQuantityToConsumeUnits > 0) {
        alert("食材库中数量不足！");
        return;
      }

      for (const batch of batchesToUpdate) {
        await updateData("pantryBatches", batch);
      }
      setPantry(updatedPantry);

      const timestamp = Date.now();
      const newMealEntry: MealEntry = {
        id: timestamp.toString(),
        food: selectedFood,
        quantityGrams: totalGramsConsumed,
        quantityUnits: quantityToConsumeUnits,
        unit: inputUnit,
        mealType,
        timestamp,
        date: format(selectedDate, "yyyy-MM-dd"),
        pantryDeductions,
      };
      await addData("mealEntries", newMealEntry);
      setDailyMeals((prevMeals) => [...prevMeals, newMealEntry]);

      setSelectedFood(null);
      setInputQuantity("");
      setInputGrams("");

      const recentFoodId = `${mealType}_${selectedFood.id}`;
      const existingRecentFood = await getData<RecentFoodEntry>(
        "recentFoods",
        recentFoodId
      );
      const newRecentEntry: RecentFoodEntry = {
        id: recentFoodId,
        mealType: mealType,
        foodId: selectedFood.id,
        quantity: quantityToConsumeUnits,
        unit: inputUnit,
        lastUsed: Date.now(),
      };

      if (existingRecentFood) {
        await updateData("recentFoods", newRecentEntry);
      } else {
        await addData("recentFoods", newRecentEntry);
      }
      const updatedRecent = await getByIndex<RecentFoodEntry>(
        "recentFoods",
        "mealTypeIndex",
        mealType
      );
      setRecentFoods(updatedRecent.sort((a, b) => b.lastUsed - a.lastUsed));
    } catch (error) {
      console.error("Error adding meal:", error);
      alert("添加饮食记录失败！");
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    console.log("Attempting to delete meal with ID:", mealId);
    try {
      const mealToDelete = dailyMeals.find(
        (meal) => (meal.id || meal.timestamp.toString()) === mealId
      );

      console.log("Found meal to delete:", mealToDelete);
      if (!mealToDelete) {
        console.error("Meal not found in state!");
        return;
      }

      // Only revert pantry deductions if they exist (for new meal entries)
      if (mealToDelete.pantryDeductions && Array.isArray(mealToDelete.pantryDeductions)) {
        const updatedPantry = [...pantry];
        const batchesToUpdateInDB: PantryBatch[] = [];

        for (const deduction of mealToDelete.pantryDeductions) {
          const batch = updatedPantry.find((b) => b.id === deduction.batchId);
          if (batch) {
            batch.remainingQuantityInUnits += deduction.consumedUnits;
            batch.remainingWeightInGrams += deduction.consumedGrams;
            batch.consumedQuantityInUnits -= deduction.consumedUnits;
            batch.consumedWeightInGrams -= deduction.consumedGrams;
            batchesToUpdateInDB.push(batch);
          }
        }

        for (const batch of batchesToUpdateInDB) {
          await updateData("pantryBatches", batch);
        }

        setPantry(updatedPantry);
      }

      const keyToDelete = mealToDelete.id || mealToDelete.timestamp.toString();
      console.log("Deleting from IndexedDB with key:", keyToDelete);
      await deleteData("mealEntries", keyToDelete);

      // Update local state
      setDailyMeals(dailyMeals.filter((meal) => (meal.id || meal.timestamp.toString()) !== mealId));
      console.log("Meal deleted from local state.");

    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("删除饮食记录失败！");
    }
  };

  const getMealTypeDisplayName = (type: MealEntry["mealType"]) => {
    switch (type) {
      case "breakfast":
        return "早餐";
      case "lunch":
        return "午餐";
      case "dinner":
        return "晚餐";
      case "snack":
        return "加餐";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">每日饮食记录</h2>

      {/* Date Picker */}
      <div className="flex justify-center mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>选择日期</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Meal Type Selection */}
      <div className="flex space-x-2">
        <Button
          onClick={() => setMealType("breakfast")}
          variant={mealType === "breakfast" ? "default" : "outline"}
        >
          早餐
        </Button>
        <Button
          onClick={() => setMealType("lunch")}
          variant={mealType === "lunch" ? "default" : "outline"}
        >
          午餐
        </Button>
        <Button
          onClick={() => setMealType("dinner")}
          variant={mealType === "dinner" ? "default" : "outline"}
        >
          晚餐
        </Button>
        <Button
          onClick={() => setMealType("snack")}
          variant={mealType === "snack" ? "default" : "outline"}
        >
          加餐
        </Button>
      </div>

      {/* Add Food to Meal Form */}
      <div className="border rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-lg font-medium">
          添加食物到 {getMealTypeDisplayName(mealType)}
        </h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {foodCategories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {!selectedFood && (
          <div className="space-y-2">
            {recentFoods.length > 0 && (
              <>
                <p className="text-sm font-medium">最近使用:</p>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.map((recent) => {
                    const food = foodDatabase.find(
                      (f) => f.id === recent.foodId
                    );
                    if (!food) return null;
                    return (
                      <Button
                        key={recent.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFood(food);
                          setInputQuantity(recent.quantity);
                          setInputUnit(recent.unit);
                        }}
                        className="rounded-full"
                      >
                        {food.name} ({recent.quantity}
                        {recent.unit === "grams" ? "克" : food.default_unit})
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
            {availableFoodsInPantry.length > 0 ? (
              <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                {availableFoodsInPantry.map((food) => (
                  <div
                    key={food.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedFood(food);
                      setInputUnit(
                        food.default_unit === "克" ||
                        food.default_unit === "毫升"
                          ? "grams"
                          : "units"
                      );
                    }}
                  >
                    {food.name} ({food.category})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">食材库中暂无食物。</p>
            )}
          </div>
        )}

        {selectedFood && (
          <div className="space-y-2">
            <p className="text-sm">
              已选择: <span className="font-semibold">{selectedFood.name}</span>
            </p>
            <div>
              <label
                htmlFor="mealQuantity"
                className="block text-sm font-medium text-gray-700"
              >
                {selectedFood.default_unit === "克" ||
                selectedFood.default_unit === "毫升"
                  ? "数量 (克/毫升)"
                  : `数量 (${selectedFood.default_unit})`}
              </label>
              <div className="flex mt-1">
                <Input
                  type="number"
                  id="mealQuantity"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(Number(e.target.value))}
                  placeholder="数量"
                  className="rounded-l-md"
                />
                <select
                  value={inputUnit}
                  onChange={(e) =>
                    setInputUnit(e.target.value as "grams" | "units")
                  }
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-r-md"
                >
                  <option value="grams">克</option>
                  {selectedFood.default_unit !== "克" &&
                    selectedFood.default_unit !== "毫升" && (
                      <option value="units">{selectedFood.default_unit}</option>
                    )}
                </select>
              </div>
            </div>
            {inputUnit === "units" &&
              selectedFood.default_unit !== "克" &&
              selectedFood.default_unit !== "毫升" && (
                <div>
                  <label
                    htmlFor="mealGrams"
                    className="block text-sm font-medium text-gray-700"
                  >
                    总克数
                  </label>
                  <Input
                    type="number"
                    id="mealGrams"
                    value={inputGrams}
                    onChange={(e) => setInputGrams(Number(e.target.value))}
                    placeholder="总克数"
                    className="mt-1"
                  />
                </div>
              )}
            <Button onClick={handleAddMeal} className="w-full">
              添加
            </Button>
          </div>
        )}
      </div>

      {/* Daily Meals List */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium">
          {format(selectedDate, "yyyy年MM月dd日")} - {" "}
          {getMealTypeDisplayName(mealType)} 饮食记录
        </h3>
        {dailyMeals.filter((meal) => meal.mealType === mealType).length ===
        0 ? (
          <p className="text-gray-500">暂无记录。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {dailyMeals
              .filter((meal) => meal.mealType === mealType)
              .map((meal) => (
                <li
                  key={meal.id || meal.timestamp} // Use timestamp as fallback key for old data
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{meal.food.name}</p>
                    <p className="text-sm text-gray-600">
                      {meal.unit === "units" && meal.quantityUnits
                        ? `${(meal.quantityUnits || 0).toFixed(1)} ${
                            meal.food.default_unit
                          } (${(meal.quantityGrams || 0).toFixed(0)} 克)`
                        : `${(meal.quantityGrams || 0).toFixed(0)} 克`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMeal(meal.id || meal.timestamp.toString())} // Handle old data without id
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DailyMealLogger;