import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Heart, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSanctuary } from '../../hooks/useSanctuary';
import './EmotionInput.css';

const EmotionInput = ({ sessionId }) => {
  const [journalText, setJournalText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showPrompts, setShowPrompts] = useState(false);
  const textareaRef = useRef(null);
  const maxLength = 2000;

  const { createJournalEntry } = useSanctuary(sessionId);

  // Inspirational prompts to help users get started
  const journalPrompts = [
    "How am I feeling right now, and what might be causing these emotions?",
    "What am I grateful for today, no matter how small?",
    "What would I tell a friend who was feeling the way I am?",
    "What does my heart need right now?",
    "What brought me a moment of peace or joy recently?",
    "What am I learning about myself through this experience?",
    "How can I show myself compassion today?",
    "What would my future self want me to know right now?"
  ];

  useEffect(() => {
    setWordCount(journalText.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [journalText]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [journalText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!journalText.trim()) {
      toast.error('Please share your thoughts before submitting');
      return;
    }

    if (journalText.length > maxLength) {
      toast.error(`Please keep your entry under ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createJournalEntry({
        content: journalText.trim(),
        session_id: sessionId
      });
      
      toast.success('Your thoughts have been added to your sanctuary');
      setJournalText('');
      setShowPrompts(false);
      
    } catch (error) {
      console.error('Error submitting journal entry:', error);
      toast.error('Unable to process your entry right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromptClick = (prompt) => {
    setJournalText(prompt);
    setShowPrompts(false);
    textareaRef.current?.focus();
  };

  const getCharacterCountColor = () => {
    const percentage = journalText.length / maxLength;
    if (percentage > 0.9) return '#ef4444';
    if (percentage > 0.7) return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className="emotion-input">
      <form onSubmit={handleSubmit} className="journal-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Share what's on your mind and heart... Every thought and feeling is welcome in your sanctuary."
            className="journal-textarea"
            disabled={isSubmitting}
            maxLength={maxLength}
            rows={3}
          />
          
          <div className="textarea-overlay">
            {journalText.trim().length === 0 && (
              <motion.button
                type="button"
                className="prompts-trigger"
                onClick={() => setShowPrompts(!showPrompts)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles size={16} />
                <span>Need inspiration?</span>
              </motion.button>
            )}
          </div>
        </div>

        <div className="input-footer">
          <div className="input-meta">
            <span className="word-count">
              {wordCount} words
            </span>
            <span 
              className="char-count"
              style={{ color: getCharacterCountColor() }}
            >
              {journalText.length}/{maxLength}
            </span>
          </div>

          <motion.button
            type="submit"
            className="submit-button"
            disabled={!journalText.trim() || isSubmitting || journalText.length > maxLength}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <Loader size={16} className="spin" />
            ) : (
              <Send size={16} />
            )}
            <span>{isSubmitting ? 'Creating...' : 'Share'}</span>
          </motion.button>
        </div>
      </form>

      {/* Journal Prompts */}
      <AnimatePresence>
        {showPrompts && (
          <motion.div
            className="prompts-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="prompts-header">
              <Heart size={16} />
              <span>Gentle prompts to guide your reflection</span>
            </div>
            
            <div className="prompts-list">
              {journalPrompts.map((prompt, index) => (
                <motion.button
                  key={index}
                  className="prompt-item"
                  onClick={() => handlePromptClick(prompt)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
            
            <div className="prompts-footer">
              <button 
                type="button"
                className="close-prompts"
                onClick={() => setShowPrompts(false)}
              >
                I'll write freely
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encouraging messages */}
      <AnimatePresence>
        {journalText.length > 0 && journalText.length < 50 && (
          <motion.div
            className="encouragement"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Keep going... your thoughts matter ✨
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {journalText.length > 200 && (
          <motion.div
            className="encouragement positive"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Beautiful reflection! Your sanctuary is growing 🌱
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmotionInput;