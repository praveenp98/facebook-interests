import { NextRequest, NextResponse } from 'next/server';
import { TokenManager } from '@/app/utils/tokenManager';

export async function GET(request: NextRequest) {
  try {
    const tokenManager = TokenManager.getInstance();
    const token = await tokenManager.getValidToken();
    
    return NextResponse.json({
      success: true,
      message: 'Token retrieved successfully',
      token_preview: `${token.substring(0, 8)}...${token.substring(token.length - 8)}`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
