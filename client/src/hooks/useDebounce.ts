import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

/**
 * Debounce hook for values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce hook for functions
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: UseDebounceOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T>>([]);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const execute = useCallback((...args: Parameters<T>) => {
    callbackRef.current(...args);
  }, []);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      if (leading && !timeoutRef.current) {
        execute(...args);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (trailing && lastArgsRef.current) {
          execute(...lastArgsRef.current);
        }
        clearTimeouts();
      }, delay);

      if (maxWait && !maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          if (trailing && lastArgsRef.current) {
            execute(...lastArgsRef.current);
          }
          clearTimeouts();
        }, maxWait);
      }

      lastCallRef.current = now;
    },
    [delay, leading, trailing, maxWait, execute, clearTimeouts]
  );

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return debounced;
}

/**
 * Debounce hook with promise support
 */
export function useDebouncePromise<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promiseRef = useRef<Promise<ReturnType<T>> | null>(null);
  const resolveRef = useRef<(value: ReturnType<T>) => void>();
  const rejectRef = useRef<(reason?: any) => void>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (promiseRef.current) {
        rejectRef.current?.(new Error('Debounced function cancelled'));
      }

      const promise = new Promise<ReturnType<T>>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callback(...args);
            resolveRef.current?.(result);
          } catch (error) {
            rejectRef.current?.(error);
          } finally {
            promiseRef.current = null;
          }
        }, delay);
      });

      promiseRef.current = promise;
      return promise;
    },
    [callback, delay]
  );
}

/**
 * Throttle hook
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCallRef.current);

      if (remaining <= 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          timeoutRef.current = null;
          callbackRef.current(...args);
        }, remaining);
      }
    },
    [delay]
  );
}