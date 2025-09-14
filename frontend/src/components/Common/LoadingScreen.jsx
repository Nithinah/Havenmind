import React from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';

const LoadingScreen = ({ 
  message = "Loading your sanctuary...", 
  subMessage = "Creating a space for healing and growth",
  showProgress = false,
  progress = 0 
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Animated Logo/Icon */}
        <motion.div 
          className="loading-icon"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="sanctuary-symbol">
            <motion.div 
              className="symbol-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="symbol-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div 
          className="loading-text"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>{message}</h2>
          {subMessage && (
            <motion.p 
              className="loading-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {subMessage}
            </motion.p>
          )}
        </motion.div>

        {/* Progress Bar */}
        {showProgress && (
          <motion.div 
            className="loading-progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </motion.div>
        )}

        {/* Floating Elements */}
        <div className="floating-elements">
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              className={`floating-element element-${index + 1}`}
              animate={{
                y: [-10, 10, -10],
                x: [-5, 5, -5],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
            />
          ))}
        </div>

        {/* Pulsing Dots */}
        <motion.div 
          className="loading-dots"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[...Array(3)].map((_, index) => (
            <motion.div
              key={index}
              className="dot"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Background Animation */}
      <div className="loading-background">
        <motion.div 
          className="bg-gradient"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;