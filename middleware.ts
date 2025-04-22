import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])
const isPublicRoute = createRouteMatcher(["/", "/api/webhooks(.*)"])
const isApiAuthRoute = createRouteMatcher(["/api/auth(.*)", "/api/uploadthing(.*)"])

// Role-specific route matchers
const isAdminRoute = createRouteMatcher(["/dashboard/admin(.*)"])
const isEmployeeRoute = createRouteMatcher(["/dashboard/employee(.*)"])
const isCustomerRoute = createRouteMatcher(["/dashboard/user(.*)"])

// Define metadata type
type UserMetadata = {
  role?: 'customer' | 'employee' | 'admin'
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth()

  // 🚀 Handle API authentication routes first
  if (isApiAuthRoute(req)) return null

  // 🚀 Handle public routes
  if (isPublicRoute(req) || isAuthRoute(req)) return null

  // 🚀 If user is not logged in, redirect to sign in
  if (!userId) {
    console.log("Redirecting to Sign In due to missing userId")
    return redirectToSignIn()
  }
  
  // Get user role from session claims
  // Use type assertion since we know our schema
  const metadata = sessionClaims?.metadata as UserMetadata || {}
  const role = metadata.role
  
  // Role-based access control for dashboard routes
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  if (isEmployeeRoute(req) && role !== 'employee' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  if (isCustomerRoute(req) && role !== 'customer' && role !== 'employee' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return null
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}