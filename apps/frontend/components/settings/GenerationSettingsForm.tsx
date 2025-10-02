'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateGenerationSettingsAction } from '../../lib/settings/actions';
import type { LlmProvider } from '../../lib/types';

interface FormState {
  success?: boolean;
  error?: string;
}

interface GenerationSettingsFormProps {
  initialProvider: LlmProvider;
  initialModel: string;
}

const initialState: FormState = {};

const PROVIDER_OPTIONS: { value: LlmProvider; label: string }[] = [
  { value: 'ollama', label: 'Ollama (local)' },
  { value: 'openai_compat', label: 'OpenAI-compatible' }
];

export function GenerationSettingsForm({ initialProvider, initialModel }: GenerationSettingsFormProps) {
  const [state, formAction] = useFormState(updateGenerationSettingsAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timeout = window.setTimeout(() => setShowSuccess(false), 3000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [state]);

  return (
    <form action={formAction} className="settings-form">
      <h2>Generation provider</h2>
      <p>Select the LLM service used for summaries and analyses.</p>
      <Fields initialProvider={initialProvider} initialModel={initialModel} />
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      {showSuccess ? <p className="form-success">Saved generation settings.</p> : null}
      <div className="settings-form__actions">
        <SubmitButton />
      </div>
    </form>
  );
}

function Fields({
  initialProvider,
  initialModel
}: {
  initialProvider: LlmProvider;
  initialModel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset className="settings-form__grid" disabled={pending}>
      <label>
        <span>Provider</span>
        <select name="llm_provider" defaultValue={initialProvider}>
          {PROVIDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Model</span>
        <input name="llm_model" defaultValue={initialModel} required />
      </label>
    </fieldset>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Saving...' : 'Save changes'}
    </button>
  );
}
