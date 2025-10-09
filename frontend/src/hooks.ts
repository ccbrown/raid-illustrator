import { useEffect, useState } from 'react';

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
