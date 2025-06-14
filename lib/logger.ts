import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ログレベル定義
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// ログエントリの型定義
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  userId?: string;
  userRole?: string;
  api?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private logDir = typeof process !== 'undefined' && process.cwd ? join(process.cwd(), 'logs') : '/tmp/logs';
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    // ログディレクトリを作成（Edge Runtimeでは無効）
    if (typeof process !== 'undefined' && process.cwd) {
      try {
        if (!existsSync(this.logDir)) {
          mkdirSync(this.logDir, { recursive: true });
        }
      } catch (error) {
        // Edge Runtimeでは無視
        console.warn('Failed to create log directory:', error);
      }
    }
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
    }) + '\n';
  }

  private writeToFile(entry: LogEntry) {
    // Edge Runtimeではファイル書き込みを無効化
    if (typeof process === 'undefined' || !process.cwd) {
      return;
    }
    
    try {
      const filename = `${new Date().toISOString().split('T')[0]}.log`;
      const filepath = join(this.logDir, filename);
      const logLine = this.formatLog(entry);
      
      appendFileSync(filepath, logLine, 'utf8');
    } catch (error) {
      // ファイル書き込みエラーはコンソールに出力のみ
      console.error('Failed to write log to file:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };

    // 開発環境：コンソールに出力
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // 赤
        [LogLevel.WARN]: '\x1b[33m',  // 黄
        [LogLevel.INFO]: '\x1b[36m',  // シアン
        [LogLevel.DEBUG]: '\x1b[37m'  // 白
      };
      const reset = '\x1b[0m';
      
      const logMessage = [
        `${colors[level]}[${entry.timestamp}] ${level}${reset}`,
        entry.requestId ? `[${entry.requestId}]` : '',
        message
      ].filter(Boolean).join(' ');

      console.log(logMessage);
      
      if (context?.metadata) {
        console.log(JSON.stringify(context.metadata, null, 2));
      }
      
      if (entry.error) {
        console.error(`${colors[LogLevel.ERROR]}Stack trace:${reset}`, entry.error.stack);
      }
    } else {
      // 本番環境：JSONで出力
      console.log(this.formatLog(entry));
    }

    // ファイルにも書き込み
    this.writeToFile(entry);
  }

  error(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Partial<LogEntry>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  // APIリクエスト専用ログ
  apiRequest(context: {
    requestId: string;
    method: string;
    api: string;
    userId?: string;
    userRole?: string;
    metadata?: Record<string, any>;
  }) {
    this.info('API Request Started', context);
  }

  apiResponse(context: {
    requestId: string;
    method: string;
    api: string;
    statusCode: number;
    duration: number;
    userId?: string;
    userRole?: string;
    metadata?: Record<string, any>;
  }) {
    const level = context.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, 'API Request Completed', context);
  }

  // エラー専用ログ
  apiError(message: string, error: Error, context?: {
    requestId?: string;
    method?: string;
    api?: string;
    userId?: string;
    userRole?: string;
    metadata?: Record<string, any>;
  }) {
    this.error(message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }

  // データベース操作ログ
  dbQuery(query: string, context?: {
    requestId?: string;
    duration?: number;
    userId?: string;
    metadata?: Record<string, any>;
  }) {
    this.debug('Database Query', {
      ...context,
      metadata: {
        ...context?.metadata,
        query: query.substring(0, 200) + (query.length > 200 ? '...' : '')
      }
    });
  }

  // S3操作ログ  
  s3Operation(operation: string, key: string, context?: {
    requestId?: string;
    bucket?: string;
    duration?: number;
    fileSize?: number;
    metadata?: Record<string, any>;
  }) {
    this.info(`S3 ${operation}`, {
      ...context,
      metadata: {
        ...context?.metadata,
        key,
        bucket: context?.bucket
      }
    });
  }

  // 認証ログ
  authAttempt(success: boolean, context: {
    requestId?: string;
    userType: 'user' | 'admin';
    username?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const message = success ? 'Authentication Success' : 'Authentication Failed';
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    
    this.log(level, message, {
      ...context,
      metadata: {
        userType: context.userType,
        username: context.username,
        ip: context.ip,
        userAgent: context.userAgent
      }
    });
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// リクエストID生成
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 実行時間測定ヘルパー
export function measureDuration<T>(fn: () => T): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return { result, duration };
}

export async function measureDurationAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
} 