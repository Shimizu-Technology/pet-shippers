import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Package, Settings, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 🎯 Keyboard detection for mobile navigation
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const initialHeight = window.innerHeight;
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialHeight - currentHeight;
        
        // Hide mobile nav when keyboard is open
        setIsKeyboardOpen(heightDifference > 150);
      }
    };

    if (window.visualViewport) {
      const viewport = window.visualViewport;
      viewport.addEventListener('resize', handleViewportChange);
      return () => viewport.removeEventListener('resize', handleViewportChange);
    }
  }, []);

  // Role-based navigation
  const getNavigation = () => {
    const basePrefix = user?.role === 'client' ? '/portal' : '/app';

    if (user?.role === 'client') {
      return [
        { name: 'Dashboard', href: `${basePrefix}/dashboard`, icon: LayoutDashboard },
        { name: 'Inbox', href: `${basePrefix}/inbox`, icon: Inbox },
        { name: 'Shipments', href: `${basePrefix}/shipments`, icon: Package },
      ];
    }

    return [
      { name: 'Inbox', href: `${basePrefix}/inbox`, icon: Inbox },
      { name: 'Shipments', href: `${basePrefix}/shipments`, icon: Package },
      { name: 'Admin', href: `${basePrefix}/admin`, icon: Settings },
    ];
  };

  const navigation = getNavigation();

  const isActive = (href: string) => {
    if (href.endsWith('/inbox')) {
      return location.pathname === href || location.pathname.startsWith(href + '/');
    }
    return location.pathname.startsWith(href);
  };



  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to={user?.role === 'client' ? '/portal/dashboard' : '/app/inbox'} className="flex items-center group">
                {/* Airplane Logo */}
                <div className="w-10 h-10 rounded-full bg-brand-coral flex items-center justify-center group-hover:bg-brand-sky transition-colors">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className="text-lg font-bold text-brand-navy leading-tight" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                    PET SHIPPERS GUAM
                  </div>
                  <div className="text-xs text-brand-sky font-medium mt-0.5 tracking-wide">
                    REUNITING YOUR FURRY LOVED ONES
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-brand-navy border-b-2 border-brand-coral'
                        : 'text-gray-500 hover:text-brand-navy'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="w-4 h-4 mr-2" />
                <div className="hidden sm:block">
                  <span className="font-medium">{user?.name}</span>
                  <span className="text-xs text-gray-500 ml-2 capitalize">({user?.role})</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 min-h-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 transition-transform duration-300 ${
        isKeyboardOpen ? 'transform translate-y-full' : 'transform translate-y-0'
      }`}>
        <div className={`grid ${navigation.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} h-16`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive(item.href)
                    ? 'text-brand-navy bg-brand-coral/10'
                    : 'text-gray-400 hover:text-brand-navy'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};