import React, { useState, useEffect } from "react";
import type { FoodItem, MealEntry, PantryBatch } from "../types";
import { foodDatabase } from "../data/foodDatabase";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DailyMealLogger: React.FC = () => {
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("breakfast");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number | "">("");
  const [inputUnit, setInputUnit] = useState<"grams" | "units">("grams");
  const [selectedCategory, setSelectedCategory] = useState<string>("所有类别"); // New state for selected category
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [dailyMeals, setDailyMeals] = useState<MealEntry[]>(() => {
    const dateString = format(new Date(), "yyyy-MM-dd");
    const savedMeals = localStorage.getItem(`dailyMeals_${dateString}`);
    return savedMeals ? JSON.parse(savedMeals) : [];
  });
  const [pantry, setPantry] = useState<PantryBatch[]>(() => {
    const savedPantry = localStorage.getItem("myPantry");
    return savedPantry ? JSON.parse(savedPantry) : [];
  });

  const [recentFoods, setRecentFoods] = useState<{
    foodId: string;
    quantity: number;
    unit: "grams" | "units";
  }[]>(() => {
    const savedRecentFoods = localStorage.getItem("recentFoods");
    return savedRecentFoods ? JSON.parse(savedRecentFoods) : [];
  });

  const foodCategories = ["所有类别", ...new Set(foodDatabase.map(food => food.category))];

  useEffect(() => {
    const dateString = format(selectedDate, "yyyy-MM-dd");
    localStorage.setItem(`dailyMeals_${dateString}`, JSON.stringify(dailyMeals));
  }, [dailyMeals, selectedDate]);

  useEffect(() => {
    localStorage.setItem("myPantry", JSON.stringify(pantry));
  }, [pantry]);

  useEffect(() => {
    localStorage.setItem("recentFoods", JSON.stringify(recentFoods));
  }, [recentFoods]);

  const availableFoodsInPantry = React.useMemo(() => {
    const availableFoodIds = new Set<string>();

    pantry.forEach(batch => {
      if (batch.remainingQuantityInUnits > 0) {
        availableFoodIds.add(batch.foodId);
      }
    });

    let foods = Array.from(availableFoodIds).map(foodId => foodDatabase.find(f => f.id === foodId)).filter(Boolean) as FoodItem[];

    if (selectedCategory !== "所有类别") {
      foods = foods.filter(food => food.category === selectedCategory);
    }

    return foods;
  }, [pantry, selectedCategory]);

  const handleAddMeal = () => {
    if (!selectedFood || inputQuantity === "") return;

    const quantityToConsumeUnits = Number(inputQuantity);
    let remainingQuantityToConsumeUnits = quantityToConsumeUnits;
    let totalGramsConsumed = 0;

    // FIFO consumption
    setPantry((prevPantry) => {
      const updatedPantry = [...prevPantry];
      const batchesToUpdate: PantryBatch[] = [];

      // Sort batches by timestamp (assuming ID is timestamp-based for FIFO)
      const sortedBatches = updatedPantry
        .filter((batch) => batch.foodId === selectedFood.id && batch.remainingQuantityInUnits > 0)
        .sort((a, b) => Number(a.id) - Number(b.id));

      for (const batch of sortedBatches) {
        if (remainingQuantityToConsumeUnits <= 0) break;

        const consumeFromThisBatchUnits = Math.min(
          remainingQuantityToConsumeUnits,
          batch.remainingQuantityInUnits
        );
        const consumeFromThisBatchGrams = consumeFromThisBatchUnits * batch.calculatedGramsPerUnit;

        batch.remainingQuantityInUnits -= consumeFromThisBatchUnits;
        batch.remainingWeightInGrams -= consumeFromThisBatchGrams;
        batch.consumedQuantityInUnits += consumeFromThisBatchUnits;
        batch.consumedWeightInGrams += consumeFromThisBatchGrams;

        totalGramsConsumed += consumeFromThisBatchGrams;
        remainingQuantityToConsumeUnits -= consumeFromThisBatchUnits;

        batchesToUpdate.push(batch);
      }

      if (remainingQuantityToConsumeUnits > 0) {
        alert("食材库中数量不足！");
        return prevPantry; // Revert changes if not enough stock
      }

      return updatedPantry.filter(batch => batch.remainingQuantityInUnits > 0 || batch.consumedQuantityInUnits > 0 || batch.spoiledQuantityInUnits > 0); // Keep batches with some history
    });

    // Add to daily meals
    setDailyMeals((prevMeals) => [
      ...prevMeals,
      {
        food: selectedFood,
        quantityGrams: totalGramsConsumed,
        mealType,
        timestamp: Date.now(),
        date: format(selectedDate, "yyyy-MM-dd"),
      },
    ]);

    setSelectedFood(null);
    setInputQuantity("");

    // Record recent food
    setRecentFoods((prevRecent) => {
      const existingIndex = prevRecent.findIndex(item => item.foodId === selectedFood.id);
      const newEntry = {
        foodId: selectedFood.id,
        quantity: quantityToConsumeUnits,
        unit: inputUnit,
      };

      if (existingIndex > -1) {
        const updatedRecent = [...prevRecent];
        updatedRecent[existingIndex] = newEntry;
        return updatedRecent;
      } else {
        return [newEntry, ...prevRecent].slice(0, 5); // Keep last 5 recent foods
      }
    });
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
            <button
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>选择日期</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date || new Date());
                const dateString = format(date || new Date(), "yyyy-MM-dd");
                const savedMeals = localStorage.getItem(`dailyMeals_${dateString}`);
                setDailyMeals(savedMeals ? JSON.parse(savedMeals) : []);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Meal Type Selection */}
      <div className="flex space-x-2">
        <button
          onClick={() => setMealType("breakfast")}
          className={`px-4 py-2 rounded-md ${
            mealType === "breakfast" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          早餐
        </button>
        <button
          onClick={() => setMealType("lunch")}
          className={`px-4 py-2 rounded-md ${
            mealType === "lunch" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          午餐
        </button>
        <button
          onClick={() => setMealType("dinner")}
          className={`px-4 py-2 rounded-md ${
            mealType === "dinner" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          晚餐
        </button>
        <button
          onClick={() => setMealType("snack")}
          className={`px-4 py-2 rounded-md ${
            mealType === "snack" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          加餐
        </button>
      </div>

      {/* Add Food to Meal Form */}
      <div className="border rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-lg font-medium">
          添加食物到 {getMealTypeDisplayName(mealType)}
        </h3>
        {/* Category Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {foodCategories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Recently Used Foods */}
        {!selectedFood && (
          <div className="space-y-2">
            {recentFoods.length > 0 && (
              <>
                <p className="text-sm font-medium">最近使用:</p>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.map((recent) => {
                    const food = foodDatabase.find(f => f.id === recent.foodId);
                    if (!food) return null;
                    return (
                      <button
                        key={recent.foodId}
                        onClick={() => {
                          setSelectedFood(food);
                          setInputQuantity(recent.quantity);
                          setInputUnit(recent.unit);
                        }}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
                      >
                        {food.name} ({recent.quantity} {recent.unit === "grams" ? "克" : food.default_unit})
                      </button>
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
                        food.default_unit === "克" || food.default_unit === "毫升"
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
                数量
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
            <button
              onClick={handleAddMeal}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              添加
            </button>
          </div>
        )}
      </div>

      {/* Daily Meals List */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium">
          {format(selectedDate, "yyyy年MM月dd日")} - {getMealTypeDisplayName(mealType)} 饮食记录
        </h3>
        {dailyMeals.filter((meal) => meal.mealType === mealType).length ===
        0 ? (
          <p className="text-gray-500">暂无记录。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {dailyMeals
              .filter((meal) => meal.mealType === mealType)
              .map((meal, index) => (
                <li
                  key={index}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{meal.food.name}</p>
                    <p className="text-sm text-gray-600">
                      {meal.quantityGrams.toFixed(0)} 克
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DailyMealLogger;
