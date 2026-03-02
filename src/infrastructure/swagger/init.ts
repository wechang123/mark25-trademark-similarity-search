/**
 * Swagger Infrastructure Initialization
 * 
 * Initializes the reflect-metadata and registers decorated APIs
 * Import this in your main application entry point or API routes
 */

import 'reflect-metadata';
import { registerDecoratedApis } from './decorators/api-decorators';

/**
 * Initialize the Swagger infrastructure
 * Call this once when your application starts
 */
export function initializeSwagger() {
  try {
    // Register all decorated APIs with the OpenAPI registry
    registerDecoratedApis();
    
    console.log('Swagger infrastructure initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Swagger infrastructure:', error);
  }
}

/**
 * Auto-initialize if this file is imported
 */
if (typeof window === 'undefined') { // Only on server-side
  initializeSwagger();
}

export default initializeSwagger;