/**
 * Agno AI Service Integration
 * Handles communication with the Agno backend service
 */

export interface AgnoMessage {
  message: string;
  user_id?: string;
  stream?: boolean;
}

export interface AgnoResponse {
  response: string;
  user_id: string;
  success: boolean;
}

export interface ProductSearchParams {
  query?: string;
  flower_type?: string;
  occasion?: string;
  price_min?: number;
  price_max?: number;
  limit?: number;
}

class AgnoService {
  private baseUrl: string;
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = import.meta.env.VITE_AGNO_URL || 'http://localhost:8082';
    this.checkHealth();
  }

  /**
   * Check if the Agno service is available
   */
  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isAvailable;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      
      this.isAvailable = response.ok;
      this.lastHealthCheck = now;
    } catch (error) {
      this.isAvailable = false;
      this.lastHealthCheck = now;
    }

    return this.isAvailable;
  }

  /**
   * Send a chat message to the Agno service
   */
  async sendMessage(message: string, userId: string = 'default'): Promise<string | null> {
    if (!await this.checkHealth()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          stream: false,
        } as AgnoMessage),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AgnoResponse = await response.json();
      
      if (data.success) {
        return data.response;
      }
      
      return null;
    } catch (error) {
      console.error('Agno service error:', error);
      this.isAvailable = false;
      return null;
    }
  }

  /**
   * Stream a chat message response
   */
  async *streamMessage(message: string, userId: string = 'default'): AsyncGenerator<string> {
    if (!await this.checkHealth()) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          stream: true,
        } as AgnoMessage),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                yield data.response;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Agno streaming error:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Search for products
   */
  async searchProducts(params: ProductSearchParams): Promise<any> {
    if (!await this.checkHealth()) {
      return null;
    }

    try {
      const queryParams = new URLSearchParams();
      
      if (params.query) queryParams.append('query', params.query);
      if (params.flower_type) queryParams.append('flower_type', params.flower_type);
      if (params.occasion) queryParams.append('occasion', params.occasion);
      if (params.price_min !== undefined) queryParams.append('price_min', params.price_min.toString());
      if (params.price_max !== undefined) queryParams.append('price_max', params.price_max.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseUrl}/api/search?${queryParams}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  }

  /**
   * Get recommendations
   */
  async getRecommendations(
    type: string = 'trending',
    userId?: string,
    occasion?: string,
    limit: number = 10
  ): Promise<any> {
    if (!await this.checkHealth()) {
      return null;
    }

    try {
      const queryParams = new URLSearchParams({
        recommendation_type: type,
        limit: limit.toString(),
      });
      
      if (userId) queryParams.append('user_id', userId);
      if (occasion) queryParams.append('occasion', occasion);

      const response = await fetch(`${this.baseUrl}/api/recommendations?${queryParams}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Recommendations error:', error);
      return null;
    }
  }

  /**
   * Get available occasions
   */
  async getOccasions(): Promise<string[] | null> {
    if (!await this.checkHealth()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/occasions`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.occasions || [];
    } catch (error) {
      console.error('Get occasions error:', error);
      return null;
    }
  }

  /**
   * Get available flower types
   */
  async getFlowerTypes(): Promise<string[] | null> {
    if (!await this.checkHealth()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/flower-types`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.flower_types || [];
    } catch (error) {
      console.error('Get flower types error:', error);
      return null;
    }
  }

  /**
   * Check if service is currently available
   */
  getAvailability(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const agnoService = new AgnoService();