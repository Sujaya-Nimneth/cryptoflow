import { MAX_POSITIVE_AMOUNT } from './userDataSchemas';

export function positiveAmountError(value: string, label: string): string | null {
  if (value.trim() === '') return `Enter a ${label.toLowerCase()}.`;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return `${label} must be greater than zero.`;
  if (amount > MAX_POSITIVE_AMOUNT) return `${label} must not exceed $1 trillion.`;
  return null;
}

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function firstInvalidField<TField extends string>(
  form: HTMLFormElement,
  errors: FieldErrors<TField>,
  fields: readonly TField[]
): TField | undefined {
  const field = fields.find((candidate) => errors[candidate]);
  if (field) form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  return field;
}
