// services/skills.js
import apiService from './api.js';

export const skillsService = {
  async getSkills(userId) {
    return apiService.get(`/skills/${userId}`);
  },

  async createSkillGoal(skillData) {
    return apiService.post('/skills', skillData);
  },

  async updateSkillProgress(skillId, progress) {
    return apiService.put(`/skills/${skillId}/progress`, { progress });
  },

  async getSkillGuidance(skillId, currentLevel) {
    return apiService.get(`/skills/${skillId}/guidance?level=${currentLevel}`);
  },

  async completeSkillActivity(activityId, result) {
    return apiService.post(`/skills/activities/${activityId}/complete`, { result });
  },

  async getRecommendedSkills(userId, interests) {
    return apiService.post(`/skills/${userId}/recommendations`, { interests });
  },

  async getSkillCategories() {
    return apiService.get('/skills/categories');
  },

  async trackSkillUsage(skillId, duration, effectiveness) {
    return apiService.post(`/skills/${skillId}/track`, { 
      duration, 
      effectiveness,
      timestamp: new Date().toISOString()
    });
  },

  async getSkillAnalytics(skillId, timeRange) {
    return apiService.get(`/skills/${skillId}/analytics?range=${timeRange}`);
  }
};