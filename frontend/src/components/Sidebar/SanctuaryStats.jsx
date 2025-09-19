import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Heart, TrendingUp, Users, Clock } from 'lucide-react';
import './SanctuaryStats.css';

const SanctuaryStats = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="sanctuary-stats loading">
        <div className="stats-skeleton">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="stat-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="sanctuary-stats empty">
        <div className="empty-stats">
          <BarChart3 size={32} className="empty-icon" />
          <p>Your sanctuary statistics will appear here as you share your thoughts and grow your healing space.</p>
        </div>
      </div>
    );
  }

  const {
    total_elements = 0,
    emotion_distribution = {},
    dominant_emotion = 'neutral',
    average_sentiment = 0,
    session_duration = 0,
    elements_this_week = 0
  } = stats;

  // Calculate sentiment category
  const getSentimentLabel = (score) => {
    if (score > 0.3) return 'Positive';
    if (score > -0.3) return 'Balanced';
    return 'Reflective';
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return '#22c55e';
    if (score > -0.3) return '#6366f1';
    return '#8b5cf6';
  };

  // Get top emotions
  const topEmotions = Object.entries(emotion_distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const formatDuration = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  const statItems = [
    {
      icon: Heart,
      label: 'Elements',
      value: total_elements,
      subtitle: 'in your sanctuary',
      color: '#ec4899'
    },
    {
      icon: Calendar,
      label: 'Journey',
      value: formatDuration(session_duration),
      subtitle: 'of growth',
      color: '#3b82f6'
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      value: elements_this_week,
      subtitle: 'new elements',
      color: '#10b981'
    },
    {
      icon: Users,
      label: 'Mood',
      value: getSentimentLabel(average_sentiment),
      subtitle: `${average_sentiment > 0 ? '+' : ''}${average_sentiment.toFixed(1)}`,
      color: getSentimentColor(average_sentiment)
    }
  ];

  return (
    <div className="sanctuary-stats">
      <div className="stats-grid">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="stat-icon" style={{ color: item.color }}>
                <Icon size={18} />
              </div>
              <div className="stat-content">
                <div className="stat-value" style={{ color: '#1f2937', fontWeight: '700' }}>
                  {item.value}
                </div>
                <div className="stat-label" style={{ color: '#374151', fontWeight: '600' }}>
                  {item.label}
                </div>
                <div className="stat-subtitle" style={{ color: '#6b7280' }}>
                  {item.subtitle}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Emotion Distribution */}
      {topEmotions.length > 0 && (
        <motion.div 
          className="emotions-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="section-header">
            <h4 style={{ color: '#1f2937' }}>Recent Emotions</h4>
            <span className="emotion-count" style={{ color: '#6b7280', backgroundColor: 'rgba(156, 163, 175, 0.2)' }}>
              {Object.keys(emotion_distribution).length} types
            </span>
          </div>
          
          <div className="emotions-list">
            {topEmotions.map(([emotion, count], index) => {
              const percentage = total_elements > 0 ? (count / total_elements * 100) : 0;
              const emotionColors = {
                joy: '#fbbf24',
                love: '#ec4899',
                gratitude: '#10b981',
                hope: '#3b82f6',
                calm: '#8b5cf6',
                sadness: '#6366f1',
                anxiety: '#f59e0b',
                anger: '#ef4444',
                neutral: '#6b7280'
              };
              
              return (
                <motion.div
                  key={emotion}
                  className="emotion-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="emotion-info">
                    <div 
                      className="emotion-dot"
                      style={{ backgroundColor: emotionColors[emotion] || '#6b7280' }}
                    />
                    <span className="emotion-name" style={{ color: '#1f2937', fontWeight: '500' }}>
                      {emotion}
                    </span>
                  </div>
                  <div className="emotion-stats">
                    <span className="emotion-count" style={{ color: '#1f2937', fontWeight: '600', backgroundColor: 'transparent' }}>
                      {count}
                    </span>
                    <span className="emotion-percentage" style={{ color: '#6b7280' }}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div 
                    className="emotion-bar"
                    style={{ 
                      backgroundColor: `${emotionColors[emotion] || '#6b7280'}20`,
                      borderColor: emotionColors[emotion] || '#6b7280'
                    }}
                  >
                    <motion.div
                      className="emotion-fill"
                      style={{ backgroundColor: emotionColors[emotion] || '#6b7280' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Growth Insights */}
      <motion.div 
        className="insights-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="section-header">
          <h4 style={{ color: '#1f2937' }}>Growth Insights</h4>
          <Clock size={14} style={{ color: '#6b7280' }} />
        </div>
        
        <div className="insights-list">
          {total_elements === 0 && (
            <div className="insight-item">
              <span className="insight-text" style={{ color: '#1f2937', fontWeight: '500' }}>
                Your sanctuary journey is just beginning
              </span>
            </div>
          )}
          
          {total_elements > 0 && elements_this_week === 0 && (
            <div className="insight-item">
              <span className="insight-text" style={{ color: '#1f2937', fontWeight: '500' }}>
                Consider sharing your thoughts this week
              </span>
            </div>
          )}
          
          {elements_this_week > 2 && (
            <div className="insight-item positive">
              <span className="insight-text" style={{ color: '#059669', fontWeight: '500' }}>
                Great consistency this week!
              </span>
            </div>
          )}
          
          {average_sentiment > 0.5 && (
            <div className="insight-item positive">
              <span className="insight-text" style={{ color: '#059669', fontWeight: '500' }}>
                ✨ You're cultivating positive energy
              </span>
            </div>
          )}
          
          {session_duration > 7 && (
            <div className="insight-item positive">
              <span className="insight-text" style={{ color: '#059669', fontWeight: '500' }}>
                ✨ Your dedication to growth shows
              </span>
            </div>
          )}
          
          {Object.keys(emotion_distribution).length > 5 && (
            <div className="insight-item">
              <span className="insight-text" style={{ color: '#1f2937', fontWeight: '500' }}>
                You're exploring emotional diversity
              </span>
            </div>
          )}
          
          {dominant_emotion && total_elements > 3 && (
            <div className="insight-item">
              <span className="insight-text" style={{ color: '#1f2937', fontWeight: '500' }}>
                {dominant_emotion} seems to be a prominent theme
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SanctuaryStats;