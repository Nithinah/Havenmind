import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Clock, TrendingUp, Award, 
  Lock, Play, BookOpen, Star, 
  Calendar, BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';

import SkillGuidance from './SkillGuidance';
import { useSkills } from '../../hooks/useSkills';
import './SkillsPanel.css';

const SkillsPanel = ({ sessionId }) => {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, stats
  const [filterStatus, setFilterStatus] = useState('all'); // all, unlocked, locked
  
  const { 
    skills, 
    skillStats, 
    isLoading, 
    practiceSkill, 
    getSkillGuidance 
  } = useSkills(sessionId);

  useEffect(() => {
    // Auto-select first unlocked skill if none selected
    if (skills && skills.length > 0 && !selectedSkill) {
      const firstUnlocked = skills.find(skill => skill.unlocked);
      if (firstUnlocked) {
        setSelectedSkill(firstUnlocked);
      }
    }
  }, [skills, selectedSkill]);

  const filteredSkills = skills?.filter(skill => {
    if (filterStatus === 'unlocked') return skill.unlocked;
    if (filterStatus === 'locked') return !skill.unlocked;
    return true;
  }) || [];

  const handleSkillSelect = (skill) => {
    if (!skill.unlocked) {
      toast.error('This skill will unlock as you continue your journey');
      return;
    }
    setSelectedSkill(skill);
    setShowGuidance(false);
  };

  const handleStartPractice = async (skill) => {
    if (!skill.unlocked) return;
    
    try {
      const guidance = await getSkillGuidance(skill.skill_name, skill.mastery_level);
      setSelectedSkill({...skill, guidance});
      setShowGuidance(true);
    } catch (error) {
      toast.error('Unable to load skill guidance');
    }
  };

  const handlePracticeComplete = async (practiceData) => {
    try {
      await practiceSkill(practiceData);
      toast.success('Practice session recorded! Your skills are growing.');
      setShowGuidance(false);
    } catch (error) {
      toast.error('Unable to record practice session');
    }
  };

  const getMasteryColor = (level) => {
    const colors = ['#9ca3af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[level] || colors[0];
  };

  const getMasteryLabel = (level) => {
    const labels = ['Beginner', 'Developing', 'Practiced', 'Skilled', 'Master'];
    return labels[level] || 'Beginner';
  };

  if (isLoading) {
    return (
      <div className="skills-panel loading">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Loading your therapeutic skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-panel">
      <div className="skills-header">
        <div className="header-content">
          <h2>Therapeutic Skills</h2>
          <p>Develop and master evidence-based therapeutic techniques for emotional wellness</p>
        </div>
        
        <div className="header-controls">
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Target size={16} />
            </button>
            <button 
              className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              <BarChart3 size={16} />
            </button>
          </div>

          <div className="filter-controls">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Skills</option>
              <option value="unlocked">Unlocked</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="skills-content">
        {viewMode === 'stats' ? (
          <div className="skills-stats">
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{skillStats?.unlocked_skills_count || 0}</div>
                  <div className="stat-label">Skills Unlocked</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{Math.floor((skillStats?.total_practice_time_minutes || 0) / 60)}h</div>
                  <div className="stat-label">Practice Time</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{skillStats?.current_streak_days || 0}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Award size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{skillStats?.total_sessions || 0}</div>
                  <div className="stat-label">Sessions</div>
                </div>
              </div>
            </div>

            {/* Mastery Distribution */}
            {skillStats?.skills_mastery_distribution && (
              <div className="mastery-chart">
                <h3>Mastery Distribution</h3>
                <div className="chart-bars">
                  {Object.entries(skillStats.skills_mastery_distribution).map(([level, count]) => (
                    <div key={level} className="chart-bar">
                      <div 
                        className="bar-fill"
                        style={{ 
                          height: `${(count / Math.max(...Object.values(skillStats.skills_mastery_distribution))) * 100}%`,
                          backgroundColor: getMasteryColor(parseInt(level))
                        }}
                      />
                      <div className="bar-label">{getMasteryLabel(parseInt(level))}</div>
                      <div className="bar-count">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="skills-grid">
            <AnimatePresence>
              {filteredSkills.map((skill, index) => (
                <motion.div
                  key={skill.skill_name}
                  className={`skill-card ${skill.unlocked ? 'unlocked' : 'locked'} ${selectedSkill?.skill_name === skill.skill_name ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: skill.unlocked ? -2 : 0 }}
                  onClick={() => handleSkillSelect(skill)}
                >
                  {!skill.unlocked && (
                    <div className="lock-overlay">
                      <Lock size={20} />
                    </div>
                  )}

                  <div className="skill-header">
                    <div className="skill-title">
                      <h3>{skill.display_name}</h3>
                      <div className="skill-category">{skill.category || 'Therapeutic Skill'}</div>
                    </div>
                    <div 
                      className="mastery-badge"
                      style={{ backgroundColor: getMasteryColor(skill.mastery_level) }}
                    >
                      {getMasteryLabel(skill.mastery_level)}
                    </div>
                  </div>

                  <div className="skill-description">
                    <p>{skill.description}</p>
                  </div>

                  {skill.unlocked && (
                    <>
                      <div className="skill-progress">
                        <div className="progress-info">
                          <span>Progress to Next Level</span>
                          <span>{Math.round(skill.progress_to_next * 100)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${skill.progress_to_next * 100}%`,
                              backgroundColor: getMasteryColor(skill.mastery_level)
                            }}
                          />
                        </div>
                      </div>

                      <div className="skill-stats">
                        <div className="stat-item">
                          <Star size={14} />
                          <span>{skill.experience_points} XP</span>
                        </div>
                        <div className="stat-item">
                          <Calendar size={14} />
                          <span>{skill.times_practiced} sessions</span>
                        </div>
                        {skill.last_practiced && (
                          <div className="stat-item">
                            <Clock size={14} />
                            <span>{new Date(skill.last_practiced).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="skill-actions">
                        <button 
                          className="practice-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPractice(skill);
                          }}
                        >
                          <Play size={14} />
                          Practice
                        </button>
                        <button 
                          className="guidance-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSkill(skill);
                          }}
                        >
                          <BookOpen size={14} />
                          Learn
                        </button>
                      </div>
                    </>
                  )}

                  {!skill.unlocked && (
                    <div className="unlock-hint">
                      <p>Continue journaling to unlock this skill</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Skill Details */}
        {selectedSkill && !showGuidance && viewMode !== 'stats' && (
          <AnimatePresence>
            <motion.div 
              className="skill-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="details-header">
                <h3>{selectedSkill.display_name}</h3>
                <div className="details-meta">
                  <div 
                    className="mastery-level"
                    style={{ color: getMasteryColor(selectedSkill.mastery_level) }}
                  >
                    {getMasteryLabel(selectedSkill.mastery_level)}
                  </div>
                  <div className="experience">{selectedSkill.experience_points} XP</div>
                </div>
              </div>

              <div className="details-content">
                <div className="description">
                  <h4>About This Skill</h4>
                  <p>{selectedSkill.description}</p>
                </div>

                {selectedSkill.current_level_info && (
                  <div className="current-level">
                    <h4>Current Level: {selectedSkill.current_level_info.title}</h4>
                    <p>{selectedSkill.current_level_info.description}</p>
                  </div>
                )}

                {selectedSkill.all_levels && (
                  <div className="level-progression">
                    <h4>Skill Progression</h4>
                    <div className="levels-list">
                      {selectedSkill.all_levels.map((level, index) => (
                        <div 
                          key={index}
                          className={`level-item ${index <= selectedSkill.mastery_level ? 'completed' : 'upcoming'}`}
                        >
                          <div className="level-marker">
                            <div 
                              className="level-dot"
                              style={{ 
                                backgroundColor: index <= selectedSkill.mastery_level 
                                  ? getMasteryColor(index) 
                                  : '#e5e7eb' 
                              }}
                            />
                            {index < selectedSkill.all_levels.length - 1 && (
                              <div className="level-line" />
                            )}
                          </div>
                          <div className="level-content">
                            <div className="level-title">
                              Level {level.level}: {level.title}
                            </div>
                            <div className="level-description">
                              {level.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSkill.unlocked && (
                  <div className="details-actions">
                    <button 
                      className="primary-action"
                      onClick={() => handleStartPractice(selectedSkill)}
                    >
                      <Play size={16} />
                      Start Guided Practice
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Skill Guidance Modal */}
      <AnimatePresence>
        {showGuidance && selectedSkill && (
          <SkillGuidance
            skill={selectedSkill}
            onComplete={handlePracticeComplete}
            onClose={() => setShowGuidance(false)}
          />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <motion.div 
          className="empty-skills"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="empty-content">
            <Target size={48} className="empty-icon" />
            <h3>No skills match your filter</h3>
            <p>Try adjusting your filter settings or continue journaling to unlock new skills.</p>
            <button 
              className="reset-filter"
              onClick={() => setFilterStatus('all')}
            >
              Show All Skills
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SkillsPanel;