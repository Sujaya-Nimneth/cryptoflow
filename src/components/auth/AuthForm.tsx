'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate, type AuthActionState } from '@/app/auth/actions';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Field';
import { validateCredentialFields, type CredentialErrors } from '@/lib/authSchemas';

const INITIAL_STATE: AuthActionState = { message: null, needsConfirmation: false };

function SubmitButton({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</Button>;
}

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [state, action] = useActionState(authenticate.bind(null, mode), INITIAL_STATE);
  const [errors, setErrors] = useState<CredentialErrors>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.field === 'email') emailRef.current?.focus();
    else if (state.field === 'password') passwordRef.current?.focus();
  }, [state]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const values = new FormData(event.currentTarget);
    const nextErrors = validateCredentialFields({
      email: values.get('email'),
      password: values.get('password'),
    });
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) {
      event.preventDefault();
      (nextErrors.email ? emailRef.current : passwordRef.current)?.focus();
    }
  }

  function changeMode() {
    setErrors({});
    formRef.current?.reset();
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
    emailRef.current?.focus();
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader
        title={mode === 'sign-in' ? 'Sign in to cloud storage' : 'Create a cloud account'}
        subtitle="Your cloud portfolio stays separate from data saved on this device."
      />
      <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="auth-email" error={errors.email}>
          <Input
            ref={emailRef}
            id="auth-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.values?.email ?? ''}
            onChange={() => setErrors((current) => ({ ...current, email: undefined }))}
            required
            maxLength={254}
          />
        </Field>
        <Field label="Password" htmlFor="auth-password" hint="Use 8–128 characters, including letters and numbers." error={errors.password}>
          <Input
            ref={passwordRef}
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            maxLength={128}
            defaultValue={state.values?.password ?? ''}
            onChange={() => setErrors((current) => ({ ...current, password: undefined }))}
          />
        </Field>
        {state.message && <p role={state.needsConfirmation ? 'status' : 'alert'} className="text-sm text-amber-200">{state.message}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SubmitButton mode={mode} />
          <Button variant="ghost" onClick={changeMode}>
            {mode === 'sign-in' ? 'Create an account' : 'Use an existing account'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
