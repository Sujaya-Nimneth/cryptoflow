'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate, type AuthActionState } from '@/app/auth/actions';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';

const INITIAL_STATE: AuthActionState = { message: null, needsConfirmation: false };

function SubmitButton({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</Button>;
}

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [state, action] = useActionState(authenticate.bind(null, mode), INITIAL_STATE);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader
        title={mode === 'sign-in' ? 'Sign in to cloud storage' : 'Create a cloud account'}
        subtitle="Your cloud portfolio stays separate from data saved on this device."
      />
      <form action={action} className="space-y-4 p-5">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="auth-email">
          <Input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </Field>
        <Field label="Password" htmlFor="auth-password" hint="At least eight characters, including letters and numbers.">
          <Input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            maxLength={128}
          />
        </Field>
        {state.message && <p role={state.needsConfirmation ? 'status' : 'alert'} className="text-sm text-amber-200">{state.message}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SubmitButton mode={mode} />
          <Button variant="ghost" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
            {mode === 'sign-in' ? 'Create an account' : 'Use an existing account'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
