// Example API service that uses session cookie authentication

import { authenticatedFetch } from '../auth/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';

/**
 * Example: Get user profile data
 */
export async function getUserProfile() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/user/profile`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Example: Update user profile
 */
export async function updateUserProfile(profileData: any) {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Example: Get protected data
 */
export async function getProtectedData() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/protected/data`);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error('Failed to fetch protected data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching protected data:', error);
    throw error;
  }
}
