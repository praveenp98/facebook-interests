import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { TokenManager } from '@/app/utils/tokenManager';

const FACEBOOK_API_VERSION = 'v18.0';
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

// Add timeout to avoid hanging requests
const axiosInstance = axios.create({
  timeout: 30000 // 30 seconds timeout
});

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    console.log('API: Received keyword:', keyword);
    
    // Get token manager instance and refresh token if needed
    const tokenManager = TokenManager.getInstance();
    const access_token = await tokenManager.getValidToken();
    const ad_account_id = process.env.FACEBOOK_AD_ACCOUNT_ID;

    console.log('API: Using account ID:', ad_account_id);

    // Search for interests with more specific parameters
    console.log('API: Making search request...');
    const searchResponse = await axiosInstance.get(`${FACEBOOK_API_BASE_URL}/search`, {
      params: {
        q: keyword,
        type: 'adinterest',
        limit: 500, // Increased limit for faster response
        access_token: access_token, // Using refreshed token
        locale: 'en_US', // Add locale for better results
        disable_scoping: true // Disable demographic scoping
      }
    });

    console.log('API: Got search response:', searchResponse.data);

    if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
      return NextResponse.json({ interests: [] });
    }

    // Store search results in a variable before processing
    const results = searchResponse.data.data;

    // Process all results in batches of 10 to avoid rate limits
    const interests = [];
    for (let i = 0; i < results.length; i += 10) {
      const batch = results.slice(i, i + 10);
      const batchPromises = batch.map(async (result) => {
        try {
          const targeting_spec = {
            geo_locations: { countries: ['US'] },
            interests: [{ id: result.id, name: result.name }]
          };

          const estimateResponse = await axiosInstance.get(
            `${FACEBOOK_API_BASE_URL}/act_${ad_account_id}/delivery_estimate`,
            {
              params: {
                optimization_goal: 'REACH',
                targeting_spec: JSON.stringify(targeting_spec),
                access_token: access_token // Using refreshed token
              }
            }
          );

          return {
            name: result.name || 'N/A',
            audience_size: estimateResponse.data.data?.[0]?.estimate_dau || 0,
            path: result.path ? result.path.join(' > ') : 'N/A',
            id: result.id || 'N/A',
            topic: result.topic || 'N/A'
          };
        } catch (error) {
          console.error(`Error getting estimate for ${result.name}:`, error);
          return {
            name: result.name || 'N/A',
            audience_size: 0,
            path: result.path ? result.path.join(' > ') : 'N/A',
            id: result.id || 'N/A',
            topic: result.topic || 'N/A'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      interests.push(...batchResults);

      // Add delay between batches
      if (i + 10 < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('API: Sending response with interests:', interests.length);

    return NextResponse.json({ interests });
  } catch (error: any) {
    console.error('Error:', error);
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    // Check if error is related to token
    if (errorMessage.includes('token') || errorMessage.includes('OAuth')) {
      try {
        // Force token refresh
        const tokenManager = TokenManager.getInstance();
        await tokenManager.forceRefreshToken();
        
        return NextResponse.json(
          {
            message: 'Token refreshed, please try again',
            error: 'Token expired and has been refreshed'
          },
          { status: 401 }
        );
      } catch (refreshError) {
        return NextResponse.json(
          {
            message: 'Error refreshing token',
            error: 'Unable to refresh token, please check credentials'
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Error searching interests',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
