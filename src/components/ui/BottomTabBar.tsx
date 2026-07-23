import { NavLink } from 'react-router-dom';
import { Home, CreditCard, Clock, User } from 'lucide-react';

const TABS = [
  { to: '/home', label: 'Главная', icon: Home },
  { to: '/card', label: 'Карта', icon: CreditCard },
  { to: '/cabinet/history', label: 'История', icon: Clock },
  { to: '/cabinet', label: 'Кабинет', icon: User },
];

/** Нижняя таб-навигация «залогиненной» части приложения — в стиле современных мобильных супераппов (eGov Mobile 3.0). */
export function BottomTabBar() {
  return (
    <nav
      className="sticky bottom-0 z-20 flex items-stretch border-t border-gray-100 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/cabinet'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all active:scale-90 ${
              isActive ? 'text-navy-700' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`flex h-7 w-9 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-navy-50' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-navy-700' : 'text-gray-400'}`} strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
