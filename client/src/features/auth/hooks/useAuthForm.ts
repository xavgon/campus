import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/shared/api/client';

export const useAuthForm = (onSubmit: () => Promise<void>) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    void onSubmit()
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return { error, isSubmitting, handleSubmit, setError };
};
