import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">健康管理</h1>
      </header>
      <main className="flex-grow p-4">
        {children}
      </main>
      {/* Future: Add a navigation bar here */}
    </div>
  );
};

export default Layout;
