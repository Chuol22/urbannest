import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  initializeWithValue?: boolean;
}

/**
 * Generic localStorage hook with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    initializeWithValue = true,
  } = options;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (!initializeWithValue) {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return deserializer(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, serializer(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for storing objects in localStorage
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T
): [T, (value: Partial<T> | ((val: T) => Partial<T>)) => void, () => void] {
  const [storedValue, setStoredValue, removeValue] = useLocalStorage<T>(key, initialValue);

  const setPartialValue = useCallback(
    (value: Partial<T> | ((val: T) => Partial<T>)) => {
      setStoredValue((prevValue) => {
        const partial = value instanceof Function ? value(prevValue) : value;
        return { ...prevValue, ...partial };
      });
    },
    [setStoredValue]
  );

  return [storedValue, setPartialValue, removeValue];
}

/**
 * Hook for storing arrays in localStorage
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): [
  T[],
  {
    push: (item: T) => void;
    remove: (index: number) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
    set: (items: T[]) => void;
  }
] {
  const [storedValue, setStoredValue, removeValue] = useLocalStorage<T[]>(key, initialValue);

  const push = useCallback(
    (item: T) => {
      setStoredValue((prev) => [...prev, item]);
    },
    [setStoredValue]
  );

  const remove = useCallback(
    (index: number) => {
      setStoredValue((prev) => prev.filter((_, i) => i !== index));
    },
    [setStoredValue]
  );

  const update = useCallback(
    (index: number, item: T) => {
      setStoredValue((prev) => {
        const newArray = [...prev];
        newArray[index] = item;
        return newArray;
      });
    },
    [setStoredValue]
  );

  const clear = useCallback(() => {
    removeValue();
  }, [removeValue]);

  const set = useCallback(
    (items: T[]) => {
      setStoredValue(items);
    },
    [setStoredValue]
  );

  return [
    storedValue,
    {
      push,
      remove,
      update,
      clear,
      set,
    },
  ];
}

/**
 * Hook for storing boolean values with toggle functionality
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [storedValue, setStoredValue] = useLocalStorage<boolean>(key, initialValue);

  const toggle = useCallback(() => {
    setStoredValue((prev) => !prev);
  }, [setStoredValue]);

  return [storedValue, toggle, setStoredValue];
}

/**
 * Hook for storing numbers with increment/decrement
 */
export function useLocalStorageNumber(
  key: string,
  initialValue: number = 0,
  options?: { min?: number; max?: number }
): [number, (value: number) => void, () => void, () => void] {
  const [storedValue, setStoredValue] = useLocalStorage<number>(key, initialValue);

  const increment = useCallback(() => {
    setStoredValue((prev) => {
      const newValue = prev + 1;
      if (options?.max !== undefined && newValue > options.max) return prev;
      return newValue;
    });
  }, [setStoredValue, options]);

  const decrement = useCallback(() => {
    setStoredValue((prev) => {
      const newValue = prev - 1;
      if (options?.min !== undefined && newValue < options.min) return prev;
      return newValue;
    });
  }, [setStoredValue, options]);

  return [storedValue, setStoredValue, increment, decrement];
}

/**
 * Hook for storing session data (clears on page session end)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}