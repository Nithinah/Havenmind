import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, RotateCcw, CheckCircle, 
  Clock, Star, Heart, ArrowRight, 
  Volume2, VolumeX, Timer 
} from 'lucide-react';
import toast from 'react-hot-toast';
import './SkillGuidance.css';

const SkillGuidance = ({ skill, onComplete, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionData, setSessionData] = useState({
    startTime: null,
    duration: 0,
    emotionsBefore: null,
    emotionsAfter: null,
    completionRating: 0,
    notes: ''
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const guidance = skill.guidance || {
    title: `${skill.display_name} Practice`,
    description: skill.description,
    steps: [
      "Take a comfortable position and prepare for practice",
      "Focus on your breathing and center yourself",
      "Begin the therapeutic technique",
      "Notice any changes in your emotional state",
      "Gradually conclude the practice session"
    ],
    duration: "10-15 minutes",
    tips: ["Practice regularly for best results", "Be patient with yourself"]
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isActive && !isPaused && sessionData.startTime) {
      interval = setInterval(() => {
        setTimer(Date.now() - sessionData.startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, sessionData.startTime]);

  // Text-to-speech for guidance
  useEffect(() => {
    if (audioEnabled && 'speechSynthesis' in window && isActive) {
      const currentStepText = guidance.steps[currentStep];
      if (currentStepText) {
        const utterance = new SpeechSynthesisUtterance(currentStepText);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    }
  }, [currentStep, audioEnabled, isActive, guidance.steps]);

  const handleStart = () => {
    setIsActive(true);
    setSessionData({
      ...sessionData,
      startTime: Date.now()
    });
    toast.success('Practice session started');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setTimer(0);
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  const handleNextStep = () => {
    if (currentStep < guidance.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    setSessionData({
      ...sessionData,
      duration: Math.floor(timer / 1000 / 60) // Convert to minutes
    });
    setShowCompletion(true);
  };

  const handleCompletionSubmit = () => {
    const practiceData = {
      session_id: skill.session_id,
      skill_name: skill.skill_name,
      duration_minutes: sessionData.duration,
      completion_rating: sessionData.completionRating,
      notes: sessionData.notes,
      emotions_before: sessionData.emotionsBefore,
      emotions_after: sessionData.emotionsAfter
    };

    onComplete(practiceData);
    setShowCompletion(false);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const emotionOptions = [
    'peaceful', 'centered', 'calm', 'hopeful', 'grateful',
    'anxious', 'stressed', 'sad', 'frustrated', 'neutral'
  ];

  return (
    <motion.div 
      className="skill-guidance-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="skill-guidance-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {!showCompletion ? (
          <>
            {/* Header */}
            <div className="guidance-header">
              <div className="skill-info">
                <h2>{guidance.title}</h2>
                <p>{guidance.description}</p>
                <div className="guidance-meta">
                  <span className="duration">
                    <Clock size={14} />
                    {guidance.duration}
                  </span>
                  <span className="current-time">
                    <Timer size={14} />
                    {formatTime(timer)}
                  </span>
                </div>
              </div>
              
              <div className="header-controls">
                <button 
                  className="audio-toggle"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  title={audioEnabled ? 'Disable audio guidance' : 'Enable audio guidance'}
                >
                  {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button className="close-btn" onClick={onClose}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="step-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / guidance.steps.length) * 100}%` }}
                />
              </div>
              <span className="step-counter">
                Step {currentStep + 1} of {guidance.steps.length}
              </span>
            </div>

            {/* Main Content */}
            <div className="guidance-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="current-step"
                >
                  <div className="step-number">Step {currentStep + 1}</div>
                  <div className="step-instruction">
                    {guidance.steps[currentStep]}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Tips */}
              {guidance.tips && guidance.tips.length > 0 && (
                <div className="practice-tips">
                  <h4>Practice Tips</h4>
                  <ul>
                    {guidance.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="guidance-controls">
              <div className="session-controls">
                {!isActive ? (
                  <button 
                    className="start-btn"
                    onClick={handleStart}
                  >
                    <Play size={16} />
                    Start Practice
                  </button>
                ) : (
                  <>
                    <button 
                      className="pause-btn"
                      onClick={handlePause}
                    >
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button 
                      className="stop-btn"
                      onClick={handleStop}
                    >
                      <RotateCcw size={16} />
                      Stop
                    </button>
                  </>
                )}
              </div>

              {isActive && (
                <div className="step-controls">
                  <button 
                    className="prev-btn"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </button>
                  <button 
                    className="next-btn"
                    onClick={handleNextStep}
                  >
                    {currentStep === guidance.steps.length - 1 ? 'Complete' : 'Next'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Completion Form */
          <div className="completion-form">
            <div className="completion-header">
              <CheckCircle size={48} className="success-icon" />
              <h2>Practice Complete!</h2>
              <p>You've completed a {formatTime(timer)} session of {skill.display_name}</p>
            </div>

            <div className="completion-content">
              {/* Emotions Before/After */}
              <div className="emotion-tracking">
                <div className="emotion-section">
                  <h4>How did you feel before practice?</h4>
                  <div className="emotion-options">
                    {emotionOptions.map(emotion => (
                      <button
                        key={`before-${emotion}`}
                        className={`emotion-btn ${sessionData.emotionsBefore === emotion ? 'selected' : ''}`}
                        onClick={() => setSessionData({
                          ...sessionData,
                          emotionsBefore: emotion
                        })}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="emotion-section">
                  <h4>How do you feel now?</h4>
                  <div className="emotion-options">
                    {emotionOptions.map(emotion => (
                      <button
                        key={`after-${emotion}`}
                        className={`emotion-btn ${sessionData.emotionsAfter === emotion ? 'selected' : ''}`}
                        onClick={() => setSessionData({
                          ...sessionData,
                          emotionsAfter: emotion
                        })}
                      >
                        {emotion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="rating-section">
                <h4>How would you rate this session?</h4>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= sessionData.completionRating ? 'filled' : ''}`}
                      onClick={() => setSessionData({
                        ...sessionData,
                        completionRating: star
                      })}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="notes-section">
                <h4>Any thoughts or reflections? (Optional)</h4>
                <textarea
                  value={sessionData.notes}
                  onChange={(e) => setSessionData({
                    ...sessionData,
                    notes: e.target.value
                  })}
                  placeholder="How did this practice feel? What did you notice about yourself?"
                  rows={3}
                />
              </div>
            </div>

            <div className="completion-actions">
              <button 
                className="skip-btn"
                onClick={() => onComplete({
                  session_id: skill.session_id,
                  skill_name: skill.skill_name,
                  duration_minutes: sessionData.duration
                })}
              >
                Skip Feedback
              </button>
              <button 
                className="submit-btn"
                onClick={handleCompletionSubmit}
              >
                <Heart size={16} />
                Save Progress
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SkillGuidance;