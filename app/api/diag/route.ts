import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const data = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoint: '/api/_diag',
    method: 'GET',
    message: 'STR Marketplace API is working!',
    serverTime: new Date().toLocaleString('en-US', { timeZone: 'UTC' })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}