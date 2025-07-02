import { useState } from 'react'
import Layout from './components/Layout'
import PersonalProfile from './components/PersonalProfile'
import MyPantry from './components/MyPantry'
import DailyMealLogger from './components/DailyMealLogger'
import Dashboard from './components/Dashboard'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <PersonalProfile />;
      case 'pantry':
        return <MyPantry />;
      case 'logger':
        return <DailyMealLogger />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <nav className="flex justify-around p-4 border-b bg-gray-100">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-md ${activeTab === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          仪表盘
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md ${activeTab === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          个人档案
        </button>
        <button
          onClick={() => setActiveTab('pantry')}
          className={`px-4 py-2 rounded-md ${activeTab === 'pantry' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          我的食材库
        </button>
        <button
          onClick={() => setActiveTab('logger')}
          className={`px-4 py-2 rounded-md ${activeTab === 'logger' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          饮食记录
        </button>
      </nav>
      <div className="mt-4">
        {renderContent()}
      </div>
    </Layout>
  )
}

export default App
