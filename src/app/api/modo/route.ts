import { NextResponse } from 'next/server';
import axios from 'axios';

const MODO_BASE = 'https://api.modo.link/canton-mainnet/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || '';
  const rawParams = searchParams.get('params');
  const apiKey = process.env.MODO_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server Modo API key is missing.' },
      { status: 503 }
    );
  }

  if (!endpoint.startsWith('/')) {
    return NextResponse.json(
      { error: 'Invalid endpoint.' },
      { status: 400 }
    );
  }

  let params: Record<string, unknown> = {};

  try {
    params = rawParams ? JSON.parse(rawParams) : {};
  } catch {
    return NextResponse.json(
      { error: 'Invalid params payload.' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(`${MODO_BASE}${endpoint}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      params,
      timeout: 35000
    });

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    const status = axiosError?.response?.status || 500;
    const data = axiosError?.response?.data || null;

    return NextResponse.json(
      { error: data || (error instanceof Error ? error.message : 'Modo request failed.') },
      { status }
    );
  }
}
