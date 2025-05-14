// src/features/ui/Footer/Footer.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Массив пунктов меню
  const menuItems = [
    { label: 'main', icon: 'fas fa-home', path: '/main' },
    { label: 'shop', icon: 'fa fa-shopping-cart', path: '/shop' },
    { label: 'game', icon: 'fa fa-angle-double-up', path: '/game' },
    { label: 'help', icon: 'fas fa-question-circle', path: '/help' },
  ];

  // Определяем активный пункт меню по текущему пути
  const activeIndex = menuItems.findIndex((item) => location.pathname.startsWith(item.path));
  
  // Рассчитываем позицию красной полоски
  const leftPosition = `${(activeIndex >= 0 ? activeIndex : 0) * 25}%`;

  return (
    <footer className="footer-bar">
      {/* Создаем пункты меню */}
      {menuItems.map((item, index) => (
        <div
          key={item.label}
          className={`footer-item ${index === activeIndex ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <i className={item.icon}></i>
        </div>
      ))}

      {/* Красная полоска, которая следует за активным пунктом */}
      <div className="footer-follow" style={{ left: leftPosition }}></div>
    </footer>
  );
}