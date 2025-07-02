import { useState } from 'react'
import { LayoutDashboard, User, History, Package, Utensils, Database } from 'lucide-react'
import Layout from './components/Layout'
import PersonalProfile from './components/PersonalProfile'
import ProfileHistoryViewer from './components/ProfileHistoryViewer'
import MyPantry from './components/MyPantry'
import DailyMealLogger from './components/DailyMealLogger'
import Dashboard from './components/Dashboard'
import FoodDatabaseViewer from './components/FoodDatabaseViewer'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <PersonalProfile />;
      case 'profileHistory':
        return <ProfileHistoryViewer />;
      case 'pantry':
        return <MyPantry />;
      case 'logger':
        return <DailyMealLogger />;
      case 'foodDatabase':
        return <FoodDatabaseViewer />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <nav className="flex justify-around p-4 border-b bg-gray-100">
        <div
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs mt-1">仪表盘</span>
        </div>
        <div
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">个人档案</span>
        </div>
        <div
          onClick={() => setActiveTab('profileHistory')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'profileHistory' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <History className="w-6 h-6" />
          <span className="text-xs mt-1">档案历史</span>
        </div>
        <div
          onClick={() => setActiveTab('pantry')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'pantry' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs mt-1">我的食材库</span>
        </div>
        <div
          onClick={() => setActiveTab('logger')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'logger' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <Utensils className="w-6 h-6" />
          <span className="text-xs mt-1">饮食记录</span>
        </div>
        <div
          onClick={() => setActiveTab('foodDatabase')}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full cursor-pointer transition-colors duration-200
            ${activeTab === 'foodDatabase' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}
          `}
        >
          <Database className="w-6 h-6" />
          <span className="text-xs mt-1">食材数据库</span>
        </div>
      </nav>
      <div className="mt-4">
        {renderContent()}
      </div>
    </Layout>
  )
}

export default App
