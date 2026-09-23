import React, { useState } from 'react';
import { Bus, Moon, Sun, Layers, TrendingUp, Route as RouteIcon, UserCheck, ShieldCheck, User, Menu, X } from 'lucide-react';
import JellyRadio from './JellyRadio';

export const Navbar = ({
  activeTab,
  setActiveTab,
  isBackendConnected,
  theme,
  toggleTheme,
  currentRole = 'admin', // 'admin' or 'commuter'
  onChangeRole,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdminView = activeTab !== 'commuter';

  const navItems = isAdminView
    ? [
        { value: 'management', label: 'Management', icon: <Layers size={13} /> },
        { value: 'performance', label: 'Performance', icon: <TrendingUp size={13} /> },
        { value: 'routes', label: 'Campus Routes', icon: <RouteIcon size={13} /> },
      ]
    : [{ value: 'commuter', label: 'Commuter Portal', icon: <UserCheck size={13} /> }];

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (val === 'commuter' && onChangeRole) onChangeRole('commuter');
    if (val !== 'commuter' && onChangeRole) onChangeRole('admin');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="navbar-container">
      <div className="navbar">
        {/* 1. Left Brand Section */}
        <div className="nav-brand-section">
          <a
            href="#home"
            className="nav-logo"
            onClick={(e) => {
              e.preventDefault();
              handleTabChange('management');
            }}
          >
            <div className="logo-badge">
              <Bus size={18} />
              <span className="logo-badge-text">MoveInSync</span>
            </div>
            <div className="logo-text-group">
              <div className="logo-main-title">
                <span>Campus Shuttle</span>
                <span className="badge-pro">PRO</span>
              </div>
              <div className="logo-subtext">Transit Operations & Dispatch</div>
            </div>
          </a>
        </div>

        {/* 2. Center Tabs (Visible on Desktop >= 1024px) */}
        <nav className="nav-center-desktop" aria-label="Main Navigation">
          <JellyRadio
            items={navItems}
            value={activeTab}
            onChange={handleTabChange}
            size="sm"
            gap={4}
            radius={16}
            chipColor="var(--bg-hover)"
            activeColor="var(--brand-primary)"
            textColor="var(--text-secondary)"
            activeTextColor="#ffffff"
            swell={0.14}
            barge={3}
            jelly={1}
            bounce={0.25}
          />
        </nav>

        {/* 3. Right Action Toolbar */}
        <div className="nav-actions">
          {/* Persona Role Switcher */}
          <button
            type="button"
            className="btn-secondary btn-role-pill"
            onClick={() => {
              if (activeTab === 'commuter') {
                handleTabChange('management');
              } else {
                handleTabChange('commuter');
              }
            }}
            title="Switch view between Admin/Dispatcher Mode and Student/Staff Commuter Mode"
          >
            {activeTab === 'commuter' ? (
              <>
                <ShieldCheck size={14} color="var(--brand-blue)" />
                <span className="role-btn-text">Admin</span>
              </>
            ) : (
              <>
                <User size={14} color="var(--brand-primary)" />
                <span className="role-btn-text">Commuter</span>
              </>
            )}
          </button>

          {/* Theme Toggle Button */}
          {activeTab !== 'commuter' && <button
            type="button"
            className="btn-icon"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>}

          {/* Mobile Navigation Toggle Button */}
          <button
            type="button"
            className="btn-icon mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Responsive Secondary Sub-Bar for Medium/Small Viewports (< 1080px) */}
      <div className={`navbar-subbar ${isMobileMenuOpen ? 'mobile-expanded' : ''}`}>
        <div className="navbar-subbar-inner">
          <JellyRadio
            items={navItems}
            value={activeTab}
            onChange={handleTabChange}
            size="sm"
            gap={4}
            radius={14}
            chipColor="var(--bg-hover)"
            activeColor="var(--brand-primary)"
            textColor="var(--text-secondary)"
            activeTextColor="#ffffff"
            swell={0.14}
            barge={3}
            jelly={1}
            bounce={0.25}
          />
        </div>
      </div>
    </header>
  );
};
