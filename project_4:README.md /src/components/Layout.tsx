import React, { useState } from 'react';
import { Menu, X, Home, Gamepad2, Spade, Coffee, Calendar, Archive, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'billiards', label: 'Tavoli Biliardi', icon: Gamepad2 },
  { id: 'cards', label: 'Tavoli Carte', icon: Spade },
  { id: 'products', label: 'Prodotti / Consumazioni', icon: Coffee },
  { id: 'history', label: 'Storico Giornate', icon: Calendar },
  { id: 'archive', label: 'Storico Consumi / Carte', icon: Archive },
  { id: 'settings', label: 'Impostazioni', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { state, dispatch } = useApp();

  const handleMenuClick = (viewId: string) => {
    dispatch({ type: 'SET_VIEW', payload: viewId });
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Sala Biliardi</h1>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = state.currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 transition-colors
                  ${isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'}
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-3"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.id === state.currentView)?.label || 'Home'}
            </h2>
            
            {!state.isDayStarted && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Giornata non iniziata
              </span>
            )}
            
            {state.isDayStarted && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Giornata attiva
              </span>
            )}
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}