// services/story.js
import apiService from './api.js';

export const storyService = {
  async getStories(userId) {
    return apiService.get(`/stories/${userId}`);
  },

  async createStory(storyData) {
    return apiService.post('/stories', storyData);
  },

  async getStory(storyId) {
    return apiService.get(`/stories/${storyId}`);
  },

  async updateStory(storyId, updates) {
    return apiService.put(`/stories/${storyId}`, updates);
  },

  async deleteStory(storyId) {
    return apiService.delete(`/stories/${storyId}`);
  },

  async generateStoryChapter(storyId, prompt, emotion) {
    return apiService.post(`/stories/${storyId}/generate-chapter`, { 
      prompt, 
      emotion 
    });
  },

  async getStoryThemes() {
    return apiService.get('/stories/themes');
  },

  async searchStories(query, filters = {}) {
    const params = new URLSearchParams({ query, ...filters });
    return apiService.get(`/stories/search?${params}`);
  },

  async shareStory(storyId, shareSettings) {
    return apiService.post(`/stories/${storyId}/share`, shareSettings);
  }
};
