// Manager authentication API: POST /api/auth/manager

import { NextRequest, NextResponse } from 'next/server';
import { compareSync } from 'bcrypt';
import { getManagerPasswordHash } from '@/lib/db/queries';
import type { ManagerAuthRequest, ManagerAuthResponse } from '@/types/api';


/**
 * POST /api/auth/manager - Authenticate manager with password
 */
export async function POST(request: NextRequest) {
  try {
    const body: ManagerAuthRequest = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json<ManagerAuthResponse>(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Get stored password hash
    const storedHash = getManagerPasswordHash();

    // Compare passwords
    const isValid = compareSync(password, storedHash);

    if (isValid) {
      // Generate simple token (timestamp-based, not for production security)
      const token = Buffer.from(`manager:${Date.now()}`).toString('base64');

      return NextResponse.json<ManagerAuthResponse>({
        success: true,
        token,
        message: 'Authentication successful',
      });
    } else {
      return NextResponse.json<ManagerAuthResponse>(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[API] Error authenticating manager:', error);
    return NextResponse.json<ManagerAuthResponse>(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
