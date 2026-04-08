import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">DesignBase</h1>
          <p className="mt-2 text-sm text-muted-foreground">Design decision tracking for UX teams</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-foreground hover:underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
