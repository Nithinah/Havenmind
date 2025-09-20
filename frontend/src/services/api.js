// Updated frontend/src/services/api.js for Render
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

console.log('🔗 API Service Configuration:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV
});

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🚀 HavenMind API Service initialized with URL:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors', // Enable CORS
      credentials: 'omit', // Don't send cookies (matches FastAPI config)
      ...options,
    };

    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: `HTTP error! status: ${response.status}` };
        }
        console.error(`❌ API Error: ${response.status}`, error);
        throw new Error(error.detail || error.message || `Request failed with status ${response.status}`);
      }

      // Handle empty responses
      if (response.status === 204) {
        console.log(`✅ API Success: ${options.method || 'GET'} ${url} (No Content)`);
        return null;
      }

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      console.error(`💥 API request failed: ${url}`, error);
      
      // Provide user-friendly error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the HavenMind server. Please check your internet connection.');
      }
      
      if (error.message.includes('CORS')) {
        throw new Error('Connection blocked by browser security. Please contact support.');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }

  // HavenMind API methods
  
  // Sanctuary API
  async getSanctuaryElements(sessionId) {
    return this.get(`/sanctuary/elements/${sessionId}`);
  }

  async createJournalEntry(entryData) {
    return this.post('/sanctuary/journal-entry', entryData);
  }

  async getSanctuaryStats(sessionId) {
    return this.get(`/sanctuary/stats/${sessionId}`);
  }

  async deleteElement(elementId) {
    return this.delete(`/sanctuary/elements/${elementId}`);
  }

  // Story API
  async getStoryHistory(sessionId, limit = 20, offset = 0) {
    return this.get(`/story/history/${sessionId}?limit=${limit}&offset=${offset}`);
  }

  async generateStory(storyData) {
    return this.post('/story/generate', storyData);
  }

  async getStoryStyles() {
    return this.get('/story/styles');
  }

  async getStoryThemes() {
    return this.get('/story/themes');
  }

  async getStoryRecommendation(sessionId) {
    return this.get(`/story/recommend/${sessionId}`);
  }

  // Skills API
  async getSkills(sessionId) {
    return this.get(`/skills/${sessionId}`);
  }

  async getSkillStats(sessionId) {
    return this.get(`/skills/statistics/${sessionId}`);
  }

  async practiceSkill(practiceData) {
    return this.post('/skills/practice', practiceData);
  }

  async getSkillGuidance(skillName, masteryLevel) {
    return this.get(`/skills/guidance/${skillName}?mastery_level=${masteryLevel}`);
  }

  // Connection test
  async testConnection() {
    try {
      const response = await this.get('/');
      console.log('🎉 Backend connection successful:', response);
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
      return false;
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;

// Test connection on app start (development only)
if (process.env.NODE_ENV === 'development') {
  // Wait a bit for the component to mount
  setTimeout(() => {
    apiService.testConnection();
  }, 1000);
}