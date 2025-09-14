import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Maximize, Minimize, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

import SanctuaryCanvas from './SanctuaryCanvas';
import { useSanctuary } from '../../hooks/useSanctuary';
import './SanctuaryContainer.css';

const SanctuaryContainer = ({ sessionId }) => {
  const {
    elements,
    isLoading,
    error,
    refreshElements,
    removeElement
  } = useSanctuary(sessionId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('canvas'); // canvas, list, grid
  const [selectedElement, setSelectedElement] = useState(null);
  const [showElementDetails, setShowElementDetails] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        toast.success('Entered fullscreen mode');
      } else {
        await document.exitFullscreen();
        toast.success('Exited fullscreen mode');
      }
    } catch (error) {
      toast.error('Fullscreen not supported');
    }
  };

  const handleExportSanctuary = async () => {
    try {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `sanctuary-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        toast.success('Sanctuary exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export sanctuary');
    }
  };

  const handleShareSanctuary = async () => {
    try {
      const shareData = {
        title: 'My HavenMind Sanctuary',
        text: `I've created a beautiful sanctuary with ${elements.length} meaningful elements. Each one represents a moment of reflection and growth.`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Sanctuary shared');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
        toast.success('Share link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share sanctuary');
    }
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
    setShowElementDetails(true);
  };

  const handleElementDelete = async (elementId) => {
    try {
      await removeElement(elementId);
      toast.success('Element removed from sanctuary');
      if (selectedElement?.id === elementId) {
        setShowElementDetails(false);
        setSelectedElement(null);
      }
    } catch (error) {
      toast.error('Failed to remove element');
    }
  };

  if (error) {
    return (
      <div className="sanctuary-error">
        <h3>Unable to load sanctuary</h3>
        <p>{error}</p>
        <button onClick={refreshElements} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`sanctuary-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Header Controls */}
      <div className="sanctuary-header">
        <div className="sanctuary-info">
          <h2>Your Sanctuary</h2>
          <span className="element-count">{elements.length} elements</span>
        </div>

        <div className="sanctuary-controls">
          <div className="view-mode-selector">
            <button
              className={`view-button ${viewMode === 'canvas' ? 'active' : ''}`}
              onClick={() => setViewMode('canvas')}
              title="Canvas View"
            >
              <Eye size={16} />
            </button>
          </div>

          <div className="action-buttons">
            <motion.button
              className="control-button"
              onClick={handleExportSanctuary}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Export Sanctuary"
            >
              <Download size={16} />
            </motion.button>

            <motion.button
              className="control-button"
              onClick={handleShareSanctuary}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Share Sanctuary"
            >
              <Share2 size={16} />
            </motion.button>

            <motion.button
              className="control-button"
              onClick={toggleFullscreen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="sanctuary-content">
        <AnimatePresence mode="wait">
          {viewMode === 'canvas' && (
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="canvas-container"
            >
              <SanctuaryCanvas
                elements={elements}
                isLoading={isLoading}
                onElementClick={handleElementClick}
                onElementDelete={handleElementDelete}
                sessionId={sessionId}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && elements.length === 0 && (
          <motion.div 
            className="empty-sanctuary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-content">
              <div className="empty-icon">🌱</div>
              <h3>Your sanctuary awaits</h3>
              <p>
                Share your thoughts and feelings to begin growing your personal sanctuary. 
                Each journal entry will bloom into a meaningful element in your healing space.
              </p>
              <div className="empty-encouragement">
                <span>✨ Start by writing in the journal</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Element Details Modal */}
      <AnimatePresence>
        {showElementDetails && selectedElement && (
          <motion.div 
            className="element-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowElementDetails(false)}
          >
            <motion.div
              className="element-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Sanctuary Element</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowElementDetails(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-content">
                <div className="element-preview">
                  {selectedElement.image_url && (
                    <img 
                      src={selectedElement.image_url}
                      alt={`${selectedElement.element_type} representing ${selectedElement.emotion}`}
                      className="element-image"
                    />
                  )}
                  <div 
                    className="element-color-preview"
                    style={{ backgroundColor: selectedElement.color }}
                  />
                </div>

                <div className="element-details">
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{selectedElement.element_type}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Emotion:</span>
                    <span className="detail-value emotion-tag" style={{ color: selectedElement.color }}>
                      {selectedElement.emotion}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sentiment:</span>
                    <span className="detail-value">
                      {selectedElement.sentiment_score > 0 ? '+' : ''}
                      {selectedElement.sentiment_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(selectedElement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {selectedElement.journal_entry && (
                    <div className="detail-section">
                      <span className="detail-label">Journal Entry:</span>
                      <div className="journal-excerpt">
                        {selectedElement.journal_entry}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                    className="delete-button"
                    onClick={() => {
                      handleElementDelete(selectedElement.id);
                      setShowElementDetails(false);
                    }}
                  >
                    Remove Element
                  </button>
                  <button 
                    className="close-modal-button"
                    onClick={() => setShowElementDetails(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="sanctuary-loading">
          <div className="loading-spinner" />
          <p>Growing your sanctuary...</p>
        </div>
      )}
    </div>
  );
};

export default SanctuaryContainer;