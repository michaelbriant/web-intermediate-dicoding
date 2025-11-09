const BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryApi {
  static async register(name, email, password) {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registrasi gagal');
    }

    return response.json();
  }

  static async login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login gagal');
    }
    
    return response.json();
  }

  static async getAllStories() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil stories');
    }

    return response.json();
  }

  static async addNewStory(formData) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menambah story');
    }

    return response.json();
  }

  static async subscribeNotification(subscription) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });
    
    if (!response.ok) {
      throw new Error('Failed to subscribe');
    }
    return response.json();
  }

  static async unsubscribeNotification(endpoint) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to unsubscribe');
    }
    return response.json();
  }
}

export default StoryApi;