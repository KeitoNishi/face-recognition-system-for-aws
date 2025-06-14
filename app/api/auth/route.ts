import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUrl, getAdminCredentials, getUserCommonPassword } from '@/lib/ssm';
import { logger, measureDurationAsync } from '@/lib/logger';
import postgres from 'postgres';

// データベース接続
let sql: any = null;

async function getDb() {
  if (!sql) {
    const databaseUrl = await getDatabaseUrl();
    sql = postgres(databaseUrl, {
      ssl: 'require'
    });
  }
  return sql;
}

// POST /api/auth - ログイン認証
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const startTime = Date.now();
  
  try {
    const { username, password, type } = await request.json();
    
    logger.apiRequest({
      requestId,
      method: 'POST',
      api: '/api/auth',
      metadata: {
        userType: type,
        username: username || 'N/A'
      }
    });

    const { result: success, duration: authDuration } = await measureDurationAsync(async () => {
      if (type === 'admin') {
        // 管理者認証
        const adminCreds = await getAdminCredentials();
        return username === adminCreds.username && password === adminCreds.password;
      } else {
        // ユーザー認証（共通パスワード）
        const userPassword = await getUserCommonPassword();
        return password === userPassword;
      }
    });

    // 認証ログ記録
    logger.authAttempt(success, {
      requestId,
      userType: type,
      username: username || undefined,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    if (success) {
      const token = Buffer.from(`${type}:${Date.now()}`).toString('base64');
      const responseData = {
        success: true,
        user: type === 'admin' ? { username, role: 'admin' } : { role: 'user' },
        token
      };

      logger.apiResponse({
        requestId,
        method: 'POST',
        api: '/api/auth',
        statusCode: 200,
        duration: Date.now() - startTime,
        userRole: type,
        metadata: {
          authDuration,
          tokenGenerated: true
        }
      });

      return NextResponse.json(responseData);
    } else {
      logger.apiResponse({
        requestId,
        method: 'POST',
        api: '/api/auth',
        statusCode: 401,
        duration: Date.now() - startTime,
        metadata: {
          authDuration,
          reason: 'Invalid credentials'
        }
      });

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.apiError('Authentication failed', error as Error, {
      requestId,
      method: 'POST',
      api: '/api/auth',
      metadata: {
        duration: Date.now() - startTime
      }
    });

    logger.apiResponse({
      requestId,
      method: 'POST',
      api: '/api/auth',
      statusCode: 500,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET /api/auth/verify - トークン検証
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // 簡単なトークン検証（実際はJWTなどを使用）
    const decoded = Buffer.from(token, 'base64').toString();
    const [role, timestamp] = decoded.split(':');
    
    // 24時間有効
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { role }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
} 