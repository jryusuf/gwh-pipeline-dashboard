# Authentication System

This document describes the authentication system implemented for the Grant Pipeline Dashboard.

## Overview

The authentication system uses Supabase for backend authentication and shadcn/ui components for the frontend interface. It includes:

- Email/password authentication
- User registration (no email confirmation required)
- Route protection for authenticated users only
- Session management

## Components

### 1. Authentication Context (`auth-context.tsx`)

The `AuthProvider` component manages the authentication state and provides the following:

- **User State**: Tracks current user session and authentication status
- **Login Function**: Authenticates users with email/password
- **Register Function**: Creates new user accounts (immediately active, no email confirmation)
- **Logout Function**: Ends user sessions

### 2. Authentication Hooks (`use-auth.ts`)

- `useRequireAuth()`: Hook to protect routes that require authentication
- `useRedirectIfAuthenticated()`: Hook to redirect authenticated users away from login/register pages

### 3. Login Page (`/login`)

Features:
- Email/password form
- Form validation
- Loading states
- Error handling
- Redirect to dashboard for authenticated users

### 4. Registration Page (`/register`)

Features:
- Email/password registration form
- Password confirmation
- Terms acceptance
- Success message with immediate access notice
- Redirect to login after registration

### 5. Protected Routes

All main application pages (`/`, `/domains`) are protected and require:
- Valid authentication

## Implementation Details

### Environment Variables

The system requires the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Usage in Components

To protect a page component:

```tsx
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <p>Access denied. Please log in.</p>
        <button onClick={() => router.push('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div>
      {/* Protected content */}
    </div>
  );
}
```

## Testing

To test the authentication system:

1. Navigate to `/test-auth` to verify authentication state
2. Try accessing protected routes without logging in
3. Register a new account and verify immediate access
4. Log in with valid credentials
5. Test logout functionality

## Security Considerations

- Passwords are handled securely by Supabase
- Session management is handled by Supabase Auth
- All authentication checks happen on both client and server sides where applicable