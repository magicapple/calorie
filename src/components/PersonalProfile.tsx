import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Import Button
import { addData, getData, updateData } from '../lib/indexedDB';
import { format } from "date-fns";
import type { PersonalProfileData, PersonalProfileHistoryEntry } from "../types";

const PersonalProfile: React.FC = () => {
  const [profile, setProfile] = useState<PersonalProfileData>({
    gender: "",
    age: "",
    height: "",
    weight: "",
    bodyFatPercentage: "",
    bmr: "",
    activeCalories: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await getData<PersonalProfileData>("currentProfile", "currentProfile");
        if (savedProfile) {
          setProfile(savedProfile);
        } else {
          // Migration from localStorage
          const localStorageProfile = localStorage.getItem("personalProfile");
          if (localStorageProfile) {
            const parsedProfile = JSON.parse(localStorageProfile);
            setProfile(parsedProfile);
            await updateData("currentProfile", { id: "currentProfile", ...parsedProfile });
            // No longer automatically add to profileHistory during initial load migration
            localStorage.removeItem("personalProfile"); // Clean up localStorage
          }
        }
      } catch (error) {
        console.error("Error loading profile from IndexedDB:", error);
      }
    };
    loadProfile();
  }, []);

  // This useEffect now only saves the current profile, not history
  useEffect(() => {
    const saveCurrentProfile = async () => {
      try {
        // Only save if profile data is not empty (to avoid saving initial empty state)
        if (profile.gender !== "" || profile.age !== "" || profile.height !== "" || profile.weight !== "" || profile.bodyFatPercentage !== "" || profile.bmr !== "" || profile.activeCalories !== "") {
          await updateData("currentProfile", { id: "currentProfile", ...profile });
          console.log("Current profile saved.");
        }
      } catch (error) {
        console.error("Error saving current profile to IndexedDB:", error);
      }
    };
    saveCurrentProfile();
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

  const handleSaveProfile = async () => {
    try {
      const timestamp = Date.now();
      const date = format(new Date(), "yyyy-MM-dd");
      const newHistoryEntry: PersonalProfileHistoryEntry = {
        timestamp,
        date,
        profileData: { ...profile }, // Save a copy of the current profile data
      };
      await addData("profileHistory", newHistoryEntry);
      alert("个人档案历史记录保存成功！");
      console.log("Profile history saved:", newHistoryEntry);
    } catch (error) {
      console.error("Error saving profile history:", error);
      alert("保存个人档案历史记录失败！");
    }
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
      <Button onClick={handleSaveProfile} className="w-full mt-4">
        保存当前档案到历史记录
      </Button>
    </div>
  );
};

export default PersonalProfile;
