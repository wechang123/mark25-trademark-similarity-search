type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'
  
  debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`🔍 ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    console.warn(`⚠️ ${message}`, ...args)
  }

  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args)
  }

  success(message: string, ...args: any[]) {
    if (this.isDev) {
      console.log(`✅ ${message}`, ...args)
    }
  }

  // API 전용 로거
  api = {
    start: (endpoint: string) => {
      if (this.isDev) {
        console.log(`🔍 API ${endpoint} - Starting request`)
      }
    },

    success: (endpoint: string, data?: any) => {
      if (this.isDev) {
        console.log(`✅ API ${endpoint} - Success`, data ? { data } : '')
      }
    },

    error: (endpoint: string, error: any) => {
      console.error(`❌ API ${endpoint} - Error:`, error)
    },

    result: (message: string, result: any) => {
      if (this.isDev) {
        console.log(`📊 ${message}`, result)
      }
    }
  }
}

export const logger = new Logger()