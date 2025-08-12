

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/agenda?error=access_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/agenda?error=missing_params', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google-calendar/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/dashboard/agenda?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Store tokens in database (create or update Google account)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: 'calendar' // We use a fixed ID for calendar connection
        }
      },
      create: {
        userId: state, // User ID from state parameter
        type: 'oauth',
        provider: 'google',
        providerAccountId: 'calendar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    });

    return NextResponse.redirect(new URL('/dashboard/agenda?connected=true', request.url));

  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(new URL('/dashboard/agenda?error=internal_error', request.url));
  }
}

