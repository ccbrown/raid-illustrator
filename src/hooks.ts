import { useCallback, useEffect, useRef, useState } from 'react';

import { useSelector } from '@/store';

export const useHashParams = (): URLSearchParams => {
    const initialHash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    const [hashParams, setHashParams] = useState(new URLSearchParams(initialHash));

    useEffect(() => {
        const update = () => {
            setHashParams(new URLSearchParams(window.location.hash.slice(1)));
        };
        update();

        window.addEventListener('hashchange', update);
        return () => {
            window.removeEventListener('hashchange', update);
        };
    }, []);

    return hashParams;
};

export const useHashParam = (key: string): string | null => {
    const hashParams = useHashParams();
    return hashParams.get(key);
};

export const useKeyDownEvents = (callback: (e: KeyboardEvent) => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            callbackRef.current(e);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
};

export const usePasteEvents = (callback: (e: ClipboardEvent) => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            callbackRef.current(e);
        };

        window.addEventListener('paste', handlePaste);
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, []);
};

export const useCopyEvents = (callback: (e: ClipboardEvent) => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            callbackRef.current(e);
        };

        window.addEventListener('copy', handleCopy);
        return () => {
            window.removeEventListener('copy', handleCopy);
        };
    }, []);
};

export const useCutEvents = (callback: (e: ClipboardEvent) => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handleCut = (e: ClipboardEvent) => {
            callbackRef.current(e);
        };

        window.addEventListener('cut', handleCut);
        return () => {
            window.removeEventListener('cut', handleCut);
        };
    }, []);
};

export const useRaid = (raidId: string) => useSelector((state) => state.raids.metadata[raidId]);
export const useRaidWorkspace = (raidId: string) => useSelector((state) => state.workspaces.raids[raidId]);
export const useScene = (sceneId: string) => useSelector((state) => state.raids.scenes[sceneId]);
export const useSceneWorkspace = (sceneId: string) => useSelector((state) => state.workspaces.scenes[sceneId]);
export const useStep = (stepId: string) => useSelector((state) => state.raids.steps[stepId]);
export const useEntity = (entityId: string) => useSelector((state) => state.raids.entities[entityId]);
export const useSelection = (raidId: string) => useSelector((state) => state.workspaces.raids[raidId]?.selection);

// Returns a callback which will when called will only actually call the provided callback at most
// once every `delay` ms.
export const useThrottledCallback = <T>(callback: (arg: T) => void, delay: number) => {
    const lastCalledRef = useRef(0);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const scheduledValueRef = useRef<
        | {
              value: T;
              timeoutId: ReturnType<typeof setTimeout>;
          }
        | undefined
    >(undefined);

    useEffect(() => {
        return () => {
            if (scheduledValueRef.current) {
                clearTimeout(scheduledValueRef.current.timeoutId);
            }
        };
    }, []);

    return useCallback(
        (arg: T) => {
            const now = Date.now();
            const elapsed = now - lastCalledRef.current;
            if (elapsed >= delay) {
                lastCalledRef.current = now;
                callbackRef.current(arg);
                if (scheduledValueRef.current) {
                    clearTimeout(scheduledValueRef.current.timeoutId);
                    scheduledValueRef.current = undefined;
                }
            } else if (!scheduledValueRef.current) {
                const timeRemaining = delay - elapsed;
                const timeoutId = setTimeout(() => {
                    if (scheduledValueRef.current) {
                        lastCalledRef.current = Date.now();
                        callbackRef.current(scheduledValueRef.current.value);
                        scheduledValueRef.current = undefined;
                    }
                }, timeRemaining);
                scheduledValueRef.current = { value: arg, timeoutId };
            } else {
                scheduledValueRef.current.value = arg;
            }
        },
        [delay],
    );
};

// Like useState, but persists the state to localStorage.
export const usePersistentState = <T>(key: string, defaultValue: T): [T, (newValue: T) => void] => {
    const prefixedKey = `persistent-state-${key}`;

    const [value, setValue] = useState<T>(() => {
        const storedValue = localStorage.getItem(prefixedKey);
        if (storedValue) {
            try {
                return JSON.parse(storedValue) as T;
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    });

    const setPersistentValue = (newValue: T) => {
        setValue(newValue);
        localStorage.setItem(prefixedKey, JSON.stringify(newValue));
    };

    return [value, setPersistentValue];
};
