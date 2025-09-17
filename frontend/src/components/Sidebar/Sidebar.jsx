import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, BookOpen, Target, Box, Menu, X, 
  Settings, User, Moon, Sun 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import EmotionInput from './EmotionInput';
import CompanionMessage from './CompanionMessage';
import SanctuaryStats from './SanctuaryStats';
import { useSanctuary } from '../../hooks/useSanctuary';
import './Sidebar.css';

const Sidebar = ({ 
  sessionId, 
  activeView, 
  onViewChange, 
  collapsed, 
  onToggleCollapse,
  is3DMode,
  onToggle3D 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  const { 
    stats, 
    companionMessage, 
    isLoading: sanctuaryLoading 
  } = useSanctuary(sessionId);

  // Navigation items
  const navigationItems = [
    {
      id: 'sanctuary',
      label: 'Sanctuary',
      icon: Home,
      path: '/sanctuary',
      description: 'Your personal healing space'
    },
    {
      id: 'story',
      label: 'Stories',
      icon: BookOpen,
      path: '/story',
      description: 'Interactive therapeutic narratives'
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: Target,
      path: '/skills',
      description: 'Therapeutic skill development'
    }
  ];

  // Handle navigation
  const handleNavigate = (item) => {
    navigate(item.path);
    onViewChange?.(item.id);
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggleCollapse?.();
    }
  };

  // Get current path for active state
  const getCurrentPath = () => {
    return location.pathname;
  };

  return (
    <motion.div 
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={{ x: -380 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <motion.div 
          className="sidebar-logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="logo-icon">🌟</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="logo-text"
              >
                <h1>HavenMind</h1>
                <span>Your sanctuary awaits</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <button 
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="nav-section-title"
            >
              Navigate
            </motion.div>
          )}
        </AnimatePresence>

        <div className="nav-items">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = getCurrentPath() === item.path;
            
            return (
              <motion.button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigate(item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={collapsed ? item.label : ''}
              >
                <div className="nav-item-icon">
                  <Icon size={20} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="nav-item-content"
                    >
                      <span className="nav-item-label">{item.label}</span>
                      <span className="nav-item-description">{item.description}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isActive && <div className="nav-item-indicator" />}
              </motion.button>
            );
          })}
        </div>

        {/* 3D Toggle (only show on sanctuary page) */}
        {getCurrentPath() === '/sanctuary' && (
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="view-mode-section"
              >
                <div className="section-title">View Mode</div>
                <button 
                  className={`mode-toggle ${is3DMode ? 'active-3d' : 'active-2d'}`}
                  onClick={onToggle3D}
                >
                  <Box size={16} />
                  <span>{is3DMode ? '3D View' : '2D View'}</span>
                  <div className="toggle-indicator" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </nav>

      {/* Main Content Area - Fixed spacing */}
      <div className="sidebar-content">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="content-sections"
            >
              {/* Share Your Thoughts - Fixed at top */}
              <div className="content-section thoughts-section">
                <div className="section-header-fixed">
                  <h3>Share Your Thoughts</h3>
                </div>
                <EmotionInput sessionId={sessionId} />
              </div>

              {/* Companion Message */}
              {companionMessage && (
                <div className="content-section companion-section">
                  <div className="section-header-fixed">
                    <h3>Luna's Message</h3>
                  </div>
                  <CompanionMessage 
                    message={companionMessage}
                    isLoading={sanctuaryLoading}
                  />
                </div>
              )}

              {/* Sanctuary Stats */}
              <div className="content-section stats-section">
                <div className="section-header-fixed">
                  <h3>Sanctuary Overview</h3>
                </div>
                <SanctuaryStats 
                  stats={stats}
                  isLoading={sanctuaryLoading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="footer-content"
            >
              <div className="user-info">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-details">
                  <span className="user-name">Welcome</span>
                  <span className="user-status">Growing & Healing</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="footer-actions">
          <button 
            className="footer-action"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          
          <button 
            className="footer-action"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="settings-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="settings-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="settings-header">
                <h3>Settings</h3>
                <button 
                  className="close-settings"
                  onClick={() => setShowSettings(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="settings-content">
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                    />
                    <span>Enable notifications</span>
                  </label>
                </div>
                
                <div className="setting-item">
                  <label>
                    <input 
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                    />
                    <span>Dark mode</span>
                  </label>
                </div>
                
                <div className="setting-item">
                  <span>Session ID:</span>
                  <code className="session-id">{sessionId?.slice(0, 8)}...</code>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;