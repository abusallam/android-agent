/**
 * Base Service Interface
 * Provides common functionality and patterns for all services
 */

export interface ServiceConfig {
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export abstract class BaseService {
  protected config: ServiceConfig;
  protected isInitialized: boolean = false;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      enableLogging: true,
      ...config,
    };
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.onInitialize();
      this.isInitialized = true;
      this.log('Service initialized successfully');
    } catch (error) {
      this.logError('Service initialization failed', error);
      throw this.createError('INITIALIZATION_FAILED', 'Failed to initialize service', error);
    }
  }

  /**
   * Cleanup service resources
   */
  public async cleanup(): Promise<void> {
    try {
      await this.onCleanup();
      this.isInitialized = false;
      this.log('Service cleaned up successfully');
    } catch (error) {
      this.logError('Service cleanup failed', error);
    }
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const details = await this.onHealthCheck();
      return {
        healthy: true,
        details: {
          initialized: this.isInitialized,
          ...details,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          initialized: this.isInitialized,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Execute operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts || 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
        this.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Create standardized error
   */
  protected createError(code: string, message: string, details?: any): ServiceError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Log message if logging is enabled
   */
  protected log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  /**
   * Log error if logging is enabled
   */
  protected logError(message: string, error?: any): void {
    if (this.config.enableLogging) {
      console.error(`[${this.constructor.name}] ${message}`, error || '');
    }
  }

  /**
   * Delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate required parameters
   */
  protected validateRequired(params: Record<string, any>): void {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        throw this.createError('VALIDATION_ERROR', `Required parameter '${key}' is missing`);
      }
    }
  }

  /**
   * Override in subclasses for custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override in subclasses for custom cleanup
   */
  protected async onCleanup(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override in subclasses for custom health checks
   */
  protected async onHealthCheck(): Promise<Record<string, any>> {
    // Default implementation - override in subclasses
    return {};
  }
}

/**
 * Service Registry for managing service instances
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, BaseService> = new Map();

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service
   */
  public register(name: string, service: BaseService): void {
    this.services.set(name, service);
  }

  /**
   * Get a registered service
   */
  public get<T extends BaseService>(name: string): T | null {
    return (this.services.get(name) as T) || null;
  }

  /**
   * Initialize all registered services
   */
  public async initializeAll(): Promise<void> {
    const initPromises = Array.from(this.services.values()).map(service =>
      service.initialize().catch(error => {
        console.error(`Failed to initialize service ${service.constructor.name}:`, error);
      })
    );

    await Promise.all(initPromises);
  }

  /**
   * Cleanup all registered services
   */
  public async cleanupAll(): Promise<void> {
    const cleanupPromises = Array.from(this.services.values()).map(service =>
      service.cleanup().catch(error => {
        console.error(`Failed to cleanup service ${service.constructor.name}:`, error);
      })
    );

    await Promise.all(cleanupPromises);
  }

  /**
   * Get health status of all services
   */
  public async getHealthStatus(): Promise<Record<string, any>> {
    const healthPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        const health = await service.getHealthStatus();
        return [name, health];
      } catch (error) {
        return [name, { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' }];
      }
    });

    const healthResults = await Promise.all(healthPromises);
    return Object.fromEntries(healthResults);
  }
}

export default BaseService;