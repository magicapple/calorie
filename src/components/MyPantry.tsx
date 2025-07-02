import React, { useState, useEffect } from "react";
import { addData, getAllData, updateData, deleteData } from '../lib/indexedDB';
import { foodDatabase } from "../data/foodDatabase";
import type { FoodItem, PantryBatch } from "../types";
import { Input } from "@/components/ui/input";

const MyPantry: React.FC = () => {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number | "">("");
  const [inputWeight, setInputWeight] = useState<number | "">(""); // New state for total weight
  const [inputUnit, setInputUnit] = useState<"grams" | "units">("grams");
  const [selectedCategory, setSelectedCategory] = useState<string>("所有类别"); // New state for selected category
  const [pantry, setPantry] = useState<PantryBatch[]>([]);

  const foodCategories = ["所有类别", ...new Set(foodDatabase.map(food => food.category))];

  useEffect(() => {
    const loadPantry = async () => {
      try {
        const savedPantry = await getAllData<PantryBatch>("pantryBatches");
        if (savedPantry.length > 0) {
          setPantry(savedPantry);
        } else {
          // Migration from localStorage
          const localStoragePantry = localStorage.getItem("myPantry");
          if (localStoragePantry) {
            const parsedPantry: PantryBatch[] = JSON.parse(localStoragePantry);
            for (const batch of parsedPantry) {
              await addData("pantryBatches", batch);
            }
            setPantry(parsedPantry);
            localStorage.removeItem("myPantry"); // Clean up localStorage
          }
        }
      } catch (error) {
        console.error("Error loading pantry from IndexedDB:", error);
      }
    };
    loadPantry();
  }, []);

  const filteredFoods = React.useMemo(() => {
    let foods = foodDatabase;

    if (selectedCategory !== "所有类别") {
      foods = foods.filter(food => food.category === selectedCategory);
    }

    return foods;
  }, [selectedCategory]);

  const handleAddFoodToPantry = async () => {
    if (!selectedFood || inputQuantity === "") return;

    const quantity = Number(inputQuantity);
    const weight = Number(inputWeight);

    let initialQuantityInUnits = 0;
    let initialWeightInGrams = 0;

    if (inputUnit === "grams") {
      initialQuantityInUnits = quantity; // 按克数入库时，数量就是克数
      initialWeightInGrams = quantity;
    } else {
      // units 模式下，需要同时有数量和总重量
      if (inputQuantity === "" || inputWeight === "") {
        alert("请输入数量和总重量！");
        return;
      }
      initialQuantityInUnits = quantity;
      initialWeightInGrams = weight;
    }

    if (initialQuantityInUnits <= 0 || initialWeightInGrams <= 0) {
      alert("数量和重量必须大于0！");
      return;
    }

    const calculatedGramsPerUnit = initialWeightInGrams / initialQuantityInUnits;

    const newBatch: PantryBatch = {
      id: Date.now().toString(), // 简单的唯一ID
      foodId: selectedFood.id,
      initialQuantityInUnits: initialQuantityInUnits,
      initialWeightInGrams: initialWeightInGrams,
      calculatedGramsPerUnit: calculatedGramsPerUnit,
      remainingQuantityInUnits: initialQuantityInUnits,
      remainingWeightInGrams: initialWeightInGrams,
      consumedQuantityInUnits: 0,
      consumedWeightInGrams: 0,
      spoiledQuantityInUnits: 0,
      spoiledWeightInGrams: 0,
    };

    try {
      await addData("pantryBatches", newBatch);
      setPantry((prevPantry) => [...prevPantry, newBatch]);
      setSelectedFood(null);
      setInputQuantity("");
      setInputWeight("");
      setInputUnit("grams"); // Reset unit to default
    } catch (error) {
      console.error("Error adding food to pantry:", error);
      alert("添加入库失败！");
    }
  };

  const handleRemoveFromPantry = async (batchId: string) => {
    try {
      await deleteData("pantryBatches", batchId);
      setPantry((prevPantry) => prevPantry.filter((batch) => batch.id !== batchId));
    } catch (error) {
      console.error("Error removing from pantry:", error);
      alert("移除失败！");
    }
  };

  const handleSpoilFood = async (batchId: string, spoiledUnits: number) => {
    try {
      setPantry((prevPantry) =>
        prevPantry.map((batch) => {
          if (batch.id === batchId) {
            const actualSpoiledUnits = Math.min(spoiledUnits, batch.remainingQuantityInUnits);
            const spoiledGrams = actualSpoiledUnits * batch.calculatedGramsPerUnit;
            const updatedBatch = {
              ...batch,
              remainingQuantityInUnits: batch.remainingQuantityInUnits - actualSpoiledUnits,
              remainingWeightInGrams: batch.remainingWeightInGrams - spoiledGrams,
              spoiledQuantityInUnits: batch.spoiledQuantityInUnits + actualSpoiledUnits,
              spoiledWeightInGrams: batch.spoiledWeightInGrams + spoiledGrams,
            };
            updateData("pantryBatches", updatedBatch); // Update in IndexedDB
            return updatedBatch;
          }
          return batch;
        })
      );
    } catch (error) {
      console.error("Error spoiling food:", error);
      alert("标记变质失败！");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">我的食材库</h2>

      {/* Add Food to Pantry Form */}
      <div className="border rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-lg font-medium">添加入库</h3>
        {/* Category Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {foodCategories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedFood(null); // Clear selected food when category changes
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        {/* Food List */}
        <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
          {filteredFoods.map((food) => (
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

        {selectedFood && (
          <div className="space-y-2">
            <p className="text-sm">
              已选择: <span className="font-semibold">{selectedFood.name}</span>
            </p>
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                {inputUnit === "grams" ? "总克数" : "数量"}
              </label>
              <div className="flex mt-1">
                <Input
                  type="number"
                  id="quantity"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(Number(e.target.value))}
                  placeholder={inputUnit === "grams" ? "总克数" : "数量"}
                  className="rounded-l-md"
                />
                <select
                  value={inputUnit}
                  onChange={(e) => {
                    setInputUnit(e.target.value as "grams" | "units");
                    setInputQuantity(""); // Clear quantity when unit changes
                    setInputWeight(""); // Clear weight when unit changes
                  }}
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
            {inputUnit === "units" && (
              <div>
                <label
                  htmlFor="totalWeight"
                  className="block text-sm font-medium text-gray-700"
                >
                  总重量 (克)
                </label>
                <Input
                  type="number"
                  id="totalWeight"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(Number(e.target.value))}
                  placeholder="总重量 (克)"
                />
              </div>
            )}
            <button
              onClick={handleAddFoodToPantry}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              添加入库
            </button>
          </div>
        )}
      </div>

      {/* Pantry List */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium">当前库存</h3>
        {pantry.length === 0 ? (
          <p className="text-gray-500">食材库为空。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pantry.map((batch) => {
              const food = foodDatabase.find(f => f.id === batch.foodId);
              if (!food) return null; // Should not happen if foodId is valid

              return (
                <li
                  key={batch.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-gray-600">
                      批次ID: {batch.id.substring(batch.id.length - 4)}
                    </p>
                    <p className="text-sm text-gray-600">
                      初始: {batch.initialQuantityInUnits} {food.default_unit} ({batch.initialWeightInGrams.toFixed(0)} 克)
                    </p>
                    <p className="text-sm text-gray-600">
                      剩余: {batch.remainingQuantityInUnits} {food.default_unit} ({batch.remainingWeightInGrams.toFixed(0)} 克)
                    </p>
                    {batch.consumedQuantityInUnits > 0 && (
                      <p className="text-sm text-gray-600">
                        已消耗: {batch.consumedQuantityInUnits} {food.default_unit} ({batch.consumedWeightInGrams.toFixed(0)} 克)
                      </p>
                    )}
                    {batch.spoiledQuantityInUnits > 0 && (
                      <p className="text-sm text-red-500">
                        已变质: {batch.spoiledQuantityInUnits} {food.default_unit} ({batch.spoiledWeightInGrams.toFixed(0)} 克)
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      单位克数: {batch.calculatedGramsPerUnit.toFixed(2)} 克/{food.default_unit}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => handleRemoveFromPantry(batch.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      移除批次
                    </button>
                    {batch.remainingQuantityInUnits > 0 && (
                      <button
                        onClick={() => {
                          const spoiledAmount = prompt(`标记 ${food.name} 变质数量 (单位: ${food.default_unit}):`);
                          if (spoiledAmount !== null && !isNaN(Number(spoiledAmount)) && Number(spoiledAmount) > 0) {
                            handleSpoilFood(batch.id, Number(spoiledAmount));
                          }
                        }}
                        className="text-orange-500 hover:text-orange-700 text-sm"
                      >
                        标记变质
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyPantry;
