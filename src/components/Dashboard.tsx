import React, { useState, useEffect } from 'react';
import { getData, addData, getByIndex } from '../lib/indexedDB';
import type { PersonalProfileData } from '../types';
import type { MealEntry } from '../types';
import { calculateBMR, calculateTotalIntake, calculateMacronutrientRatios, checkProteinTarget, calculateAntiInflammatoryScore } from '../utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiquidFillGauge from "@/components/ui/liquid-fill-gauge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<PersonalProfileData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyMeals, setDailyMeals] = useState<MealEntry[]>([]);
  const [greeting, setGreeting] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('早上好');
      setBackgroundImage('/images/morning.jpg');
    } else if (hour < 18) {
      setGreeting('下午好');
      setBackgroundImage('/images/afternoon.jpg');
    } else {
      setGreeting('晚上好');
      setBackgroundImage('/images/evening.jpg');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile data
        const savedProfile = await getData<PersonalProfileData>("currentProfile", "currentProfile");
        if (savedProfile) {
          setProfile(savedProfile);
        }

        // Load daily meals for selected date
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const meals = await getByIndex<MealEntry>("mealEntries", "dateIndex", dateString);
        setDailyMeals(meals);

        // --- Migration from localStorage (Daily Meals) ---
        const localStorageDailyMealsKey = `dailyMeals_${dateString}`;
        const localStorageDailyMeals = localStorage.getItem(localStorageDailyMealsKey);
        if (localStorageDailyMeals) {
          const parsedMeals: MealEntry[] = JSON.parse(localStorageDailyMeals);
          for (const meal of parsedMeals) {
            await addData("mealEntries", meal);
          }
          setDailyMeals(parsedMeals);
          localStorage.removeItem(localStorageDailyMealsKey);
        }

      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
      }
    };
    loadData();
  }, [selectedDate]);

  const totalIntake = calculateTotalIntake(dailyMeals);
  const bmr = profile && profile.bmr !== "" && Number(profile.bmr) > 0 ? Number(profile.bmr) : (profile ? calculateBMR(profile) : 0);
  const totalExpenditure = bmr + (profile?.activeCalories ? Number(profile.activeCalories) : 0);
  const energyBalance = totalIntake.calories - totalExpenditure;

  // Calculate fill percentage for LiquidFillGauge
  const maxDeviation = 500; // Max expected deviation for full/empty gauge
  let fillPercentage = 50; // 50% for balanced
  let liquidColor = 'var(--primary-green)'; // Default for balanced

  if (energyBalance > 0) {
    // Energy surplus
    fillPercentage = 50 + (energyBalance / maxDeviation) * 50;
    if (fillPercentage > 100) fillPercentage = 100;
    liquidColor = 'var(--accent-pink)'; // Red for surplus
  } else if (energyBalance < 0) {
    // Energy deficit
    fillPercentage = 50 + (energyBalance / maxDeviation) * 50; // energyBalance is negative
    if (fillPercentage < 0) fillPercentage = 0;
    liquidColor = 'var(--accent-blue)'; // Blue for deficit
  }

  const macronutrientRatios = calculateMacronutrientRatios(
    totalIntake.protein,
    totalIntake.carbohydrate,
    totalIntake.fat
  );

  const proteinTargetStatus = profile ? checkProteinTarget(totalIntake.protein, profile.weight) : { status: '未知', target: 0 };
  const antiInflammatoryScore = calculateAntiInflammatoryScore(dailyMeals);

  return (
    <div className="p-4 space-y-6">
      <div className="relative w-full h-48 rounded-lg overflow-hidden mb-6">
        <img src={backgroundImage} alt="氛围图片" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <h2 className="text-3xl font-bold text-white text-center">{greeting}</h2>
        </div>
      </div>

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
              {selectedDate ? format(selectedDate, "PPP") : <span>选择日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 能量平衡 */}
      <Card>
        <CardHeader>
          <CardTitle>能量平衡</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center md:items-start justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="space-y-2 w-full md:w-1/2">
            <p>总摄入: <span className="font-medium">{totalIntake.calories.toFixed(0)} kcal</span></p>
            <p>静息消耗 (BMR): <span className="font-medium">{bmr.toFixed(0)} kcal</span></p>
            <p>运动消耗: <span className="font-medium">{profile?.activeCalories || 0} kcal</span></p>
            <p>总消耗: <span className="font-medium">{totalExpenditure.toFixed(0)} kcal</span></p>
            <p className={`text-xl font-bold ${energyBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
              能量净值: {energyBalance.toFixed(0)} kcal
            </p>
            {energyBalance > 0 && <p className="text-sm text-red-500">建议: 减少热量摄入或增加运动。</p>}
            {energyBalance < 0 && <p className="text-sm text-green-500">建议: 保持良好平衡。</p>}
            {energyBalance === 0 && <p className="text-sm text-gray-500">建议: 能量摄入与消耗平衡。</p>}
          </div>
          <div className="w-full md:w-1/2 h-48 relative flex items-center justify-center">
            <LiquidFillGauge
              value={fillPercentage}
              centerText={`${energyBalance.toFixed(0)} kcal`}
              liquidColor={liquidColor}
            />
          </div>
        </CardContent>
      </Card>

      {/* 宏量营养素分析 */}
      <Card>
        <CardHeader>
          <CardTitle>宏量营养素分析</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center md:items-start justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="space-y-2 w-full md:w-1/2">
            <p>蛋白质: <span className="font-medium">{totalIntake.protein.toFixed(1)} g</span> ({macronutrientRatios.proteinRatio.toFixed(1)}%)</p>
            <p>碳水化合物: <span className="font-medium">{totalIntake.carbohydrate.toFixed(1)} g</span> ({macronutrientRatios.carbohydrateRatio.toFixed(1)}%)</p>
            <p>脂肪: <span className="font-medium">{totalIntake.fat.toFixed(1)} g</span> ({macronutrientRatios.fatRatio.toFixed(1)}%)</p>
            <p>蛋白质摄入: {proteinTargetStatus.status} (目标: {proteinTargetStatus.target.toFixed(1)} g/kg)</p>
            {proteinTargetStatus.status === '未达标' && <p className="text-sm text-red-500">建议: 增加蛋白质摄入。</p>}
          </div>
          <div className="w-full md:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '蛋白质', value: totalIntake.protein * 4 },
                { name: '碳水化合物', value: totalIntake.carbohydrate * 4 },
                { name: '脂肪', value: totalIntake.fat * 9 },
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="var(--accent-blue)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 抗炎饮食追踪 */}
      <Card>
        <CardHeader>
          <CardTitle>抗炎饮食追踪</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center md:items-start justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="space-y-2 w-full md:w-1/2">
            <p>抗炎食物占比: <span className="font-medium">{antiInflammatoryScore.toFixed(1)}%</span></p>
            {antiInflammatoryScore < 50 && <p className="text-sm text-red-500">建议: 增加抗炎食物摄入。</p>}
            {antiInflammatoryScore >= 50 && <p className="text-sm text-green-500">建议: 保持良好的抗炎饮食。</p>}
          </div>
          <div className="w-full md:w-1/2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '抗炎食物', value: antiInflammatoryScore },
                    { name: '非抗炎食物', value: 100 - antiInflammatoryScore },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell key="cell-0" fill="var(--primary-green)" />
                  <Cell key="cell-1" fill="var(--accent-pink)" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 数据导出为AI提示词 */}
      <Card>
        <CardHeader>
          <CardTitle>数据导出为AI提示词</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              const aiPrompt = `
# 我的健康与饮食日记 - ${format(selectedDate, "yyyy年MM月dd日")}

## 个人档案
- 年龄: ${profile?.age || '未知'}, 性别: ${profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : '未知'}, 身高: ${profile?.height || '未知'}cm
- 体重: ${profile?.weight || '未知'}kg, 体脂率: ${profile?.bodyFatPercentage || '未知'}%

## 能量平衡分析
- 今日摄入: ${totalIntake.calories.toFixed(0)} kcal
- 静息消耗: ${bmr.toFixed(0)} kcal
- 运动消耗: ${profile?.activeCalories || 0} kcal
- **能量净值**: ${energyBalance.toFixed(0)} kcal

## 宏量营养素摄入
- 蛋白质: ${totalIntake.protein.toFixed(1)}g
- 碳水化合物: ${totalIntake.carbohydrate.toFixed(1)}g
- 脂肪: ${totalIntake.fat.toFixed(1)}g

## 今日食谱
${dailyMeals.map(meal => `- ${meal.food.name}: ${meal.quantityGrams.toFixed(0)}g (${meal.mealType === 'breakfast' ? '早餐' : meal.mealType === 'lunch' ? '午餐' : '晚餐'})`).join('\n')}

**我的目标**: [请在此处填写您的具体目标，例如：减肥/增肌/改善抗炎指数]
**请基于以上数据，为我提供专业的饮食和健康建议。**
              `;
              navigator.clipboard.writeText(aiPrompt);
              alert('AI提示词已复制到剪贴板！');
            }}
            className="w-full"
          >
            复制今日总结到剪贴板
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
