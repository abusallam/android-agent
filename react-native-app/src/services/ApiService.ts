/**
 * API Service
 * Handles all HTTP API communications with proper error handling and retry logic
 */

import { BaseService, ServiceConfig } from './BaseService';
import { API_CONFIG } from '../constants';

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

class ApiService extends BaseService {
  private static instance: ApiService;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  public static getInstance(config?: ServiceConfig): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(config);
    }
    return ApiService.instance;
  }

  private constructor(config?: ServiceConfig) {
    super({
      apiUrl: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
      ...config,
    });

    this.baseUrl = this.config.apiUrl || API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Get current auth token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Make GET request
   */
  public async get<T = any>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Make POST request
   */
  public async post<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  /**
   * Make PUT request
   */
  public async put<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  /**
   * Make DELETE request
   */
  public async delete<T = any>(
    endpoint: string,
    config?: Omit<ApiRequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Make PATCH request
   */
  public async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: Omit<ApiRequestConfig, 'method'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  /**
   * Make generic HTTP request
   */
  public async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retryAttempts,
    } = config;

    const url = this.buildUrl(endpoint);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    this.log(`${method} ${url}`, body);

    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await this.parseResponse<T>(response);
        
        if (!response.ok) {
          throw this.createApiError(response, responseData);
        }

        this.log(`${method} ${url} - Success (${response.status})`);

        return {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: this.parseHeaders(response.headers),
        };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw this.createError('TIMEOUT', `Request timeout after ${timeout}ms`);
        }
        
        throw error;
      }
    }, retries);
  }

  /**
   * Upload file
   */
  public async uploadFile<T = any>(
    endpoint: string,
    file: File | Blob,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = { ...this.defaultHeaders };
    delete headers['Content-Type']; // Let browser set multipart boundary

    this.log(`POST ${url} - File upload`);

    return this.executeWithRetry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await this.parseResponse<T>(response);
      
      if (!response.ok) {
        throw this.createApiError(response, responseData);
      }

      this.log(`POST ${url} - Upload success (${response.status})`);

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
      };
    });
  }

  /**
   * Download file
   */
  public async downloadFile(endpoint: string): Promise<Blob> {
    const url = this.buildUrl(endpoint);
    
    this.log(`GET ${url} - File download`);

    return this.executeWithRetry(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw this.createApiError(response, errorData);
      }

      this.log(`GET ${url} - Download success (${response.status})`);
      return response.blob();
    });
  }

  /**
   * Build full URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Parse response data
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as unknown as T;
    }
    
    return response.blob() as unknown as T;
  }

  /**
   * Parse response headers
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Create API error from response
   */
  private createApiError(response: Response, data: any): ApiError {
    const message = data?.message || data?.error || response.statusText || 'API request failed';
    
    return {
      code: `HTTP_${response.status}`,
      message,
      status: response.status,
      details: data,
    };
  }

  /**
   * Health check implementation
   */
  protected async onHealthCheck(): Promise<Record<string, any>> {
    try {
      const startTime = Date.now();
      await this.get('/health');
      const responseTime = Date.now() - startTime;
      
      return {
        baseUrl: this.baseUrl,
        authenticated: !!this.authToken,
        responseTime,
      };
    } catch (error) {
      throw new Error(`API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ApiService;