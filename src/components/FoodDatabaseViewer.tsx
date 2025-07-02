import React, { useState } from 'react';
import { foodDatabase } from '../data/foodDatabase';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FoodDatabaseViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('所有类别');

  const foodCategories = ['所有类别', ...new Set(foodDatabase.map(food => food.category))];

  const filteredFoodDatabase = foodDatabase.filter(food => {
    const matchesSearchTerm = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '所有类别' || food.category === selectedCategory;
    return matchesSearchTerm && matchesCategory;
  });

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center">食材数据库</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="text"
          placeholder="搜索食材..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          {foodCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有食材</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead>卡路里 (kcal)</TableHead>
                  <TableHead>蛋白质 (g)</TableHead>
                  <TableHead>碳水 (g)</TableHead>
                  <TableHead>脂肪 (g)</TableHead>
                  <TableHead>抗炎</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFoodDatabase.map(food => (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell>{food.category}</TableCell>
                    <TableCell>{food.calories.toFixed(0)}</TableCell>
                    <TableCell>{food.protein.toFixed(1)}</TableCell>
                    <TableCell>{food.carbohydrate.toFixed(1)}</TableCell>
                    <TableCell>{food.fat.toFixed(1)}</TableCell>
                    <TableCell>{food.is_anti_inflammatory ? '是' : '否'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodDatabaseViewer;