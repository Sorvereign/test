import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LRUCache } from 'lru-cache'

const ipRequestsMap = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000, // 1 minute
})

function rateLimit(ip: string, limit: number): boolean {
  const currentRequests = ipRequestsMap.get(ip) || 0
  
  if (currentRequests >= limit) {
    return false
  }
  
  ipRequestsMap.set(ip, currentRequests + 1)
  return true
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'anonymous'
  
  if (request.method === 'POST') {
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10)
    if (contentLength > 10 * 1024) { // 10KB
      return new NextResponse('Payload too large', { status: 413 })
    }
  }
  
  if (!rateLimit(ip, 10)) {
    console.log(`Rate limit exceeded for ${ip}`)
    return new NextResponse('Too many requests', { status: 429 })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
} 