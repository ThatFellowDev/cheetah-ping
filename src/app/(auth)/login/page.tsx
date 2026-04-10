'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GlowButton } from '@/shared/components/motion-wrapper';
import { authClient } from '@/modules/auth/auth-client';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Mail, ArrowLeft } from 'lucide-react';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verify Turnstile token if configured
      if (TURNSTILE_SITE_KEY && turnstileToken) {
        const verifyRes = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });

        if (!verifyRes.ok) {
          const data = await verifyRes.json();
          setError(data.error || 'Verification failed. Please try again.');
          turnstileRef.current?.reset();
          setTurnstileToken('');
          return;
        }
      }

      await authClient.signIn.magicLink({
        email,
        callbackURL: '/dashboard',
      });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md glass border-0 animate-fade-in-up overflow-visible">
        <CardContent className="pt-10 pb-10 px-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a login link to <strong className="text-foreground break-all">{email}</strong>.
            <br />Click it to sign in. It expires in 5 minutes.
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              setSent(false);
              setEmail('');
              setTurnstileToken('');
              turnstileRef.current?.reset();
            }}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4 animate-fade-in-up">
      <div className="text-center mb-2">
        <Link href="/" className="font-heading text-2xl font-bold gradient-text">
          Cheetah Ping
        </Link>
      </div>

      <Card className="glass border-0 overflow-visible">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-6">
            <h1 className="font-heading text-xl font-bold">
              Get started free
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              No credit card required. 5 free monitors.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11 text-base"
              />
            </div>

            {TURNSTILE_SITE_KEY && (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onError={() => setTurnstileToken('')}
                  onExpire={() => setTurnstileToken('')}
                  options={{ theme: 'dark', size: 'flexible' }}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <GlowButton
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
            >
              {loading ? 'Sending link...' : 'Continue with email'}
            </GlowButton>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-foreground hover:text-primary underline underline-offset-2 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-foreground hover:text-primary underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account? Just enter your email above.
      </p>
    </div>
  );
}
