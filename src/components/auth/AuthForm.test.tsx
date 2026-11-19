import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthForm from './AuthForm';

const auth = vi.hoisted(() => ({
  action: vi.fn(),
  state: { message: null, needsConfirmation: false } as Record<string, unknown>,
}));

vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, useActionState: () => [auth.state, auth.action] };
});

vi.mock('react-dom', async (importOriginal) => {
  const reactDom = await importOriginal<typeof import('react-dom')>();
  return { ...reactDom, useFormStatus: () => ({ pending: false }) };
});

vi.mock('@/app/auth/actions', () => ({ authenticate: vi.fn() }));

afterEach(() => {
  cleanup();
  auth.state = { message: null, needsConfirmation: false };
  vi.clearAllMocks();
});

describe('accessible cloud authentication', () => {
  it('validates email semantics and focuses the invalid field', () => {
    render(<AuthForm next="/" />);
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('spellcheck', 'false');
    expect(email).toHaveAttribute('autocomplete', 'email');
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123' } });
    fireEvent.submit(document.querySelector('form')!);
    expect(email).toHaveFocus();
    expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    expect(auth.action).not.toHaveBeenCalled();
  });

  it('focuses the field identified by the server without restoring a password', async () => {
    auth.state = {
      message: 'Email or password is incorrect. Check both and try again.',
      needsConfirmation: false,
      field: 'password',
      values: { email: 'person@example.com', password: '' },
    };
    render(<AuthForm next="/" />);
    await waitFor(() => expect(screen.getByLabelText('Password')).toHaveFocus());
    expect(screen.getByLabelText('Email')).toHaveValue('person@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent('incorrect');
  });
});
