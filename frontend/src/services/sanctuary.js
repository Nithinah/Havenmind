import apiService from './api.js';

export const sanctuaryService = {
  async getSanctuary(userId) {
    return apiService.get(`/sanctuary/${userId}`);
  },

  async createSanctuary(sanctuaryData) {
    return apiService.post('/sanctuary', sanctuaryData);
  },

  async updateSanctuary(sanctuaryId, updates) {
    return apiService.put(`/sanctuary/${sanctuaryId}`, updates);
  },

  async deleteSanctuary(sanctuaryId) {
    return apiService.delete(`/sanctuary/${sanctuaryId}`);
  },

  async analyzeSentiment(emotion, description) {
    return apiService.post('/sanctuary/sentiment', { emotion, description });
  },

  async generateSanctuaryImage(mood, theme) {
    return apiService.post('/sanctuary/generate-image', { mood, theme });
  },

  async getCompanionMessage(emotion, context) {
    return apiService.post('/sanctuary/companion-message', { emotion, context });
  },

  async getSanctuaryStats(userId) {
    return apiService.get(`/sanctuary/${userId}/stats`);
  },

  async updateMood(sanctuaryId, mood, intensity) {
    return apiService.post(`/sanctuary/${sanctuaryId}/mood`, { mood, intensity });
  }
};