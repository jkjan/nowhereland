import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if admin exists in the system (only when no JWT)
  const checkAdminExists = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('id')
        .eq('is_admin', true)
        .limit(1);
      
      if (error) {
        console.error('Error checking admin exists:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkAdminExists:', error);
      return false;
    }
  };

  // Get current user and extract metadata from JWT
  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { user: null, isAdmin: false };
      }

      // Extract user metadata from JWT token (no additional DB call needed)
      const userMetadata = user.app_metadata || {};
      const isAdmin = userMetadata.is_admin === true;

      return { user, isAdmin };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return { user: null, isAdmin: false };
    }
  };

  const { pathname } = request.nextUrl;

  // Handle admin authentication routes
  if (pathname.startsWith('/admin')) {
    const { user, isAdmin } = await getCurrentUser();

    // Admin signup route access policy
    if (pathname === '/admin/signup') {
      if (user) {
        // Has JWT
        if (isAdmin) {
          // is_admin = true? redirect to admin
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          // is_admin = false? redirect to pending
          return NextResponse.redirect(new URL('/admin/signup/pending', request.url));
        }
      } else {
        // No JWT
        const adminExists = await checkAdminExists();
        if (adminExists) {
          // admin exists = true? forbidden
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        } else {
          // admin exists = false? return signUpPage
          return response;
        }
      }
    }

    // Admin signin route access policy
    if (pathname === '/admin/signin') {
      if (user) {
        // Has JWT - same with signup policy
        if (isAdmin) {
          // is_admin = true? redirect to admin
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          // is_admin = false? redirect to pending
          return NextResponse.redirect(new URL('/admin/signup/pending', request.url));
        }
      } else {
        // No JWT
        const adminExists = await checkAdminExists();
        if (adminExists) {
          // admin exists = true? response signinpage
          return response;
        } else {
          // admin exists = false? redirects to signUp
          return NextResponse.redirect(new URL('/admin/signup', request.url));
        }
      }
    }

    // Admin pending page access policy
    if (pathname === '/admin/signup/pending') {
      if (user) {
        if (isAdmin) {
          // Admin user accessing pending page, redirect to admin
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        // Non-admin user can stay on pending page
        return response;
      } else {
        // No JWT, redirect to appropriate auth page
        const adminExists = await checkAdminExists();
        if (adminExists) {
          return NextResponse.redirect(new URL('/admin/signin', request.url));
        } else {
          return NextResponse.redirect(new URL('/admin/signup', request.url));
        }
      }
    }

    // Protected admin routes access policy
    if (pathname.startsWith('/admin') && 
        pathname !== '/admin/signin' && 
        pathname !== '/admin/signup' && 
        pathname !== '/admin/signup/pending') {
      
      if (user) {
        // Has JWT
        if (isAdmin) {
          // is_admin = true? OK
          return response;
        } else {
          // is_admin = false? redirect to pending
          return NextResponse.redirect(new URL('/admin/signup/pending', request.url));
        }
      } else {
        // No JWT
        const adminExists = await checkAdminExists();
        if (adminExists) {
          // admin exists = true? redirect to signIn
          return NextResponse.redirect(new URL('/admin/signin', request.url));
        } else {
          // admin exists = false? redirect to signUp
          return NextResponse.redirect(new URL('/admin/signup', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match admin routes for authentication
     */
    '/admin/:path*',
  ],
};