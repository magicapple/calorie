import React, { useState, useEffect } from "react";
import { getAllData } from "../lib/indexedDB";
import type { PersonalProfileHistoryEntry } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const ProfileHistoryViewer: React.FC = () => {
  const [historyData, setHistoryData] = useState<PersonalProfileHistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getAllData<PersonalProfileHistoryEntry>("profileHistory");
        // Sort data by timestamp to ensure chronological order
        data.sort((a, b) => a.timestamp - b.timestamp);
        setHistoryData(data);
      } catch (error) {
        console.error("Error loading profile history:", error);
      }
    };
    loadHistory();
  }, []);

  // Prepare data for Recharts
  const chartData = historyData.map((entry) => ({
    date: format(new Date(entry.timestamp), "yyyy-MM-dd"),
    weight: entry.profileData.weight === "" ? null : Number(entry.profileData.weight),
    bodyFatPercentage: entry.profileData.bodyFatPercentage === "" ? null : Number(entry.profileData.bodyFatPercentage),
  }));

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">个人档案历史记录</h2>

      {historyData.length === 0 ? (
        <p className="text-gray-500">暂无历史记录。</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-2">体重变化 (kg)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">体脂率变化 (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bodyFatPercentage"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHistoryViewer;
