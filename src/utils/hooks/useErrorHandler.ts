
import { useState } from 'react';
import { toast } from 'react-toastify';

export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: unknown, friendlyMessage?: string) => {
    console.error(error);
    
    const message = friendlyMessage || 
      (error instanceof Error ? error.message : 'An unknown error occurred');
    
    toast.error(message);
    setError(error instanceof Error ? error : new Error(message));
    
    return error;
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    clearError
  };
};