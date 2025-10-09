import { useEffect, useRef, useState } from 'react';

export const useHashParams = (): URLSearchParams => {
    const [hashParams, setHashParams] = useState(new URLSearchParams(window.location.hash.slice(1)));

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

export const useKeyPressEvents = (callback: (e: KeyboardEvent) => void) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            callbackRef.current(e);
        };

        window.addEventListener('keypress', handleKeyDown);
        return () => {
            window.removeEventListener('keypress', handleKeyDown);
        };
    }, []);
};
