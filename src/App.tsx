// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage';
import ShopPage from './pages/ShopPage/ShopPage';
import GamePage from './pages/GamePage/GamePage';
import HelpPage from './pages/HelpPage/HelpPage';
import Header from './features/ui/Header/Header';
import Footer from './features/ui/Footer/Footer';

function AppContent() {
  const location = useLocation();
  const isShopPage = location.pathname === '/shop';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#242424' }}>
      <Header />
      <Footer />
      
      <main style={{
  marginTop: '40px',
  marginBottom: '50px',
  padding: isShopPage ? '0' : '20px',
  height: 'calc(100vh - 90px)', // ДОБАВИТЬ
  overflow: 'hidden' // ДОБАВИТЬ
}}>
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;