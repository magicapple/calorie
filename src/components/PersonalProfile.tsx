import React, { useState, useEffect } from "react";
import type { PersonalProfileData } from "../types";

const PersonalProfile: React.FC = () => {
  const [profile, setProfile] = useState<PersonalProfileData>(() => {
    const savedProfile = localStorage.getItem("personalProfile");
    return savedProfile
      ? JSON.parse(savedProfile)
      : {
          gender: "",
          age: "",
          height: "",
          weight: "",
          bodyFatPercentage: "",
          bmr: "",
          activeCalories: "",
        };
  });

  useEffect(() => {
    localStorage.setItem("personalProfile", JSON.stringify(profile));
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value === "" ? "" : name === "gender" ? value : Number(value),
    }));
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">个人健康档案</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            性别
          </label>
          <select
            id="gender"
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">请选择</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-700"
          >
            年龄
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={profile.age}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="岁"
          />
        </div>
        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700"
          >
            身高 (cm)
          </label>
          <input
            type="number"
            id="height"
            name="height"
            value={profile.height}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="厘米"
          />
        </div>
        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-gray-700"
          >
            体重 (kg)
          </label>
          <input
            type="number"
            id="weight"
            name="weight"
            value={profile.weight}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="公斤"
          />
        </div>
        <div>
          <label
            htmlFor="bodyFatPercentage"
            className="block text-sm font-medium text-gray-700"
          >
            体脂率 (%)
          </label>
          <input
            type="number"
            id="bodyFatPercentage"
            name="bodyFatPercentage"
            value={profile.bodyFatPercentage}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="百分比"
          />
        </div>
        <div>
          <label
            htmlFor="bmr"
            className="block text-sm font-medium text-gray-700"
          >
            静息消耗 (BMR, kcal)
          </label>
          <input
            type="number"
            id="bmr"
            name="bmr"
            value={profile.bmr}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="大卡"
          />
        </div>
        <div>
          <label
            htmlFor="activeCalories"
            className="block text-sm font-medium text-gray-700"
          >
            运动消耗 (kcal)
          </label>
          <input
            type="number"
            id="activeCalories"
            name="activeCalories"
            value={profile.activeCalories}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="大卡"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;
