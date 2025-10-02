'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { Topic, TopicFilters } from '../../lib/types';

interface TopicFormState {
  success?: boolean;
  error?: string;
  topic?: Topic;
}

interface TopicFormProps {
  action: (state: TopicFormState, formData: FormData) => Promise<TopicFormState>;
  initialValues?: {
    name: string;
    description?: string;
    filters: TopicFilters;
  };
  submitLabel: string;
  onSuccess?: (topic: Topic) => void;
  onCancel?: () => void;
}

function filtersToTextarea(values?: string[]): string {
  return values?.join('\n') ?? '';
}

const initialState: TopicFormState = {};

export function TopicForm({ action, initialValues, submitLabel, onSuccess, onCancel }: TopicFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state?.success && state.topic) {
      onSuccess?.(state.topic);
      formRef.current?.reset();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="topic-form">
      <div className="topic-form__row">
        <label>
          <span>Name</span>
          <input name="name" defaultValue={initialValues?.name ?? ''} required />
        </label>
        <label>
          <span>Description</span>
          <input name="description" defaultValue={initialValues?.description ?? ''} />
        </label>
      </div>
      <div className="topic-form__row topic-form__row--stacked">
        <label>
          <span>Categories (one per line)</span>
          <textarea
            name="categories"
            rows={3}
            defaultValue={filtersToTextarea(initialValues?.filters.categories)}
          />
        </label>
        <label>
          <span>Keywords (one per line)</span>
          <textarea
            name="keywords"
            rows={3}
            defaultValue={filtersToTextarea(initialValues?.filters.keywords)}
          />
        </label>
      </div>
      <div className="topic-form__row">
        <label>
          <span>Date from</span>
          <input type="date" name="dateFrom" defaultValue={initialValues?.filters.date_from ?? ''} />
        </label>
        <label>
          <span>Date to</span>
          <input type="date" name="dateTo" defaultValue={initialValues?.filters.date_to ?? ''} />
        </label>
      </div>
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      <div className="topic-form__actions">
        <SubmitButton label={submitLabel} />
        {onCancel ? (
          <CancelButton onCancel={onCancel} />
        ) : null}
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Saving...' : label}
    </button>
  );
}

function CancelButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="button" className="button button--ghost" onClick={onCancel} disabled={pending}>
      Cancel
    </button>
  );
}
