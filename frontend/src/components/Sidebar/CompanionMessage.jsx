import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Loader, MoreHorizontal, Sparkles } from 'lucide-react';
import './CompanionMessage.css';

const CompanionMessage = ({ message, isLoading, timestamp }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);

  // Typing animation effect
  useEffect(() => {
    if (message && !isLoading) {
      setIsVisible(true);
      setIsTyping(true);
      setDisplayedText('');

      const typingSpeed = 30; // milliseconds per character
      let currentIndex = 0;

      const typeMessage = () => {
        if (currentIndex < message.length) {
          setDisplayedText(prev => prev + message[currentIndex]);
          currentIndex++;
          setTimeout(typeMessage, typingSpeed);
        } else {
          setIsTyping(false);
        }
      };

      // Small delay before starting to type
      const startDelay = setTimeout(typeMessage, 500);

      return () => {
        clearTimeout(startDelay);
      };
    }
  }, [message, isLoading]);

  // Determine if message is long and needs truncation
  const isLongMessage = message && message.length > 150;
  const truncatedMessage = isLongMessage && !showFullMessage 
    ? message.substring(0, 150) + '...' 
    : message;

  const displayMessage = showFullMessage ? message : truncatedMessage;

  if (isLoading) {
    return (
      <div className="companion-message loading">
        <div className="companion-avatar">
          <div className="avatar-icon loading-pulse">
            <Loader size={16} className="spin" />
          </div>
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="companion-name">Luna</span>
            <span className="message-status">thinking...</span>
          </div>
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="companion-message empty">
        <div className="companion-avatar">
          <div className="avatar-icon">
            <MessageCircle size={16} />
          </div>
        </div>
        <div className="message-content">
          <div className="empty-message">
            <p>Luna will respond to your journal entries with supportive guidance and insights.</p>
            <div className="empty-hint">
              <Sparkles size={14} />
              <span>Share your thoughts to receive personalized support</span>
            </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="companion-message active"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="companion-avatar">
            <motion.div 
              className="avatar-icon"
              animate={{ 
                scale: isTyping ? [1, 1.1, 1] : 1,
              }}
              transition={{ 
                duration: 1.5, 
                repeat: isTyping ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Heart size={16} />
            </motion.div>
          </div>

          <div className="message-content">
            <div className="message-header">
              <span className="companion-name">Luna</span>
              {timestamp && (
                <span className="message-timestamp">
                  {new Date(timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>

            <motion.div 
              className="message-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p>
                {isTyping ? displayedText : displayMessage}
                {isTyping && (
                  <motion.span
                    className="typing-cursor"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    |
                  </motion.span>
                )}
              </p>

              {isLongMessage && !isTyping && (
                <button 
                  className="expand-button"
                  onClick={() => setShowFullMessage(!showFullMessage)}
                >
                  {showFullMessage ? 'Show less' : 'Read more'}
                </button>
              )}
            </motion.div>

            {!isTyping && (
              <motion.div 
                className="message-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="message-actions">
                  <button 
                    className="action-button"
                    title="This message was helpful"
                    onClick={() => {
                      // Could implement feedback tracking here
                    }}
                  >
                    <Heart size={12} />
                  </button>
                  <button 
                    className="action-button"
                    title="More options"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
                <div className="companion-signature">
                  <span>with care from Luna</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanionMessage;