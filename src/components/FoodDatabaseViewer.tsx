import React, { useState } from 'react';
import { foodDatabase } from '../data/foodDatabase';
import type { FoodItem } from '../types';

const FoodDatabaseViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>(foodDatabase);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term === '') {
      setFilteredFoods(foodDatabase);
    } else {
      setFilteredFoods(
        foodDatabase.filter(food =>
          food.name.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">食物营养数据库</h2>
      <input
        type="text"
        placeholder="搜索食物..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map(food => (
          <div key={food.id} className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-medium">{food.name}</h3>
            <p className="text-sm text-gray-600">分类: {food.category}</p>
            <p className="text-sm text-gray-600">默认单位: {food.default_unit} ({food.grams_per_unit}g)</p>
            <p className="text-sm text-gray-600">热量: {food.calories} kcal/100g</p>
            <p className="text-sm text-gray-600">蛋白质: {food.protein}g/100g</p>
            <p className="text-sm text-gray-600">碳水: {food.carbohydrate}g/100g</p>
            <p className="text-sm text-gray-600">脂肪: {food.fat}g/100g</p>
            {food.is_anti_inflammatory && (
              <p className="text-sm text-green-600">抗炎食物</p>
            )}
            {food.anti_inflammatory_compounds.length > 0 && (
              <p className="text-sm text-green-600">抗炎成分: {food.anti_inflammatory_compounds.join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodDatabaseViewer;
