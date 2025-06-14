import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseUrl } from '@/lib/ssm';
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

// GET /api/venues - 会場一覧取得
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const startTime = Date.now();

  try {
    logger.apiRequest({
      requestId,
      method: 'GET',
      api: '/api/venues'
    });

    const { result: venues, duration: dbDuration } = await measureDurationAsync(async () => {
      const db = await getDb();
      return await db`
        SELECT id, name, created_at 
        FROM venues 
        ORDER BY created_at DESC
      `;
    });

    logger.dbQuery('SELECT venues ORDER BY created_at DESC', {
      requestId,
      duration: dbDuration,
      metadata: {
        recordCount: venues.length
      }
    });

    const responseData = {
      success: true,
      venues: venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        createdAt: venue.created_at
      }))
    };

    logger.apiResponse({
      requestId,
      method: 'GET',
      api: '/api/venues',
      statusCode: 200,
      duration: Date.now() - startTime,
      metadata: {
        venueCount: venues.length,
        dbDuration
      }
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.apiError('Failed to fetch venues', error as Error, {
      requestId,
      method: 'GET',
      api: '/api/venues',
      metadata: {
        duration: Date.now() - startTime
      }
    });

    logger.apiResponse({
      requestId,
      method: 'GET',
      api: '/api/venues',
      statusCode: 500,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { success: false, message: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}

// POST /api/venues - 会場作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（簡易版）
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Venue name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const newVenue = await db`
      INSERT INTO venues (name, created_at)
      VALUES (${name.trim()}, NOW())
      RETURNING id, name, created_at
    `;

    return NextResponse.json({
      success: true,
      venue: {
        id: newVenue[0].id,
        name: newVenue[0].name,
        createdAt: newVenue[0].created_at
      }
    });
  } catch (error) {
    console.error('Create venue error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create venue' },
      { status: 500 }
    );
  }
} 