import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function CheckEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  const handleOpenMail = () => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="p-4 sm:p-6">
        <button
          onClick={() => navigate('/auth/signup')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="text-lg text-muted-foreground">
              We've sent a confirmation link to
            </p>
            <p className="text-lg font-medium">{email}</p>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to confirm your account and continue to SideHive.
            </p>

            <Button
              onClick={handleOpenMail}
              variant="hero"
              size="lg"
              className="w-full"
            >
              Open mail app
            </Button>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Didn't receive the email?</p>
              <p>Check your spam folder or contact support.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
