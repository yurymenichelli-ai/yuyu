import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';
import HomeScreen from './components/HomeScreen';
import BilliardsScreen from './components/BilliardsScreen';
import CardsScreen from './components/CardsScreen';
import ProductsScreen from './components/ProductsScreen';
import HistoryScreen from './components/HistoryScreen';
import ArchiveScreen from './components/ArchiveScreen';
import SettingsScreen from './components/SettingsScreen';

function AppContent() {
  const { state } = useApp();

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'home':
        return <HomeScreen />;
      case 'billiards':
        return <BilliardsScreen />;
      case 'cards':
        return <CardsScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'archive':
        return <ArchiveScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <Layout>
      {renderCurrentView()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;