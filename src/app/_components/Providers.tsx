'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { PrimeReactProvider } from 'primereact/api';
import { PropsWithChildren } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { twMerge } from 'tailwind-merge';

import { PersistenceProvider, store } from '@/store';

export const Providers = ({ children }: PropsWithChildren) => {
    useServerInsertedHTML(() => {
        return <></>;
    });

    return (
        <ReduxProvider store={store}>
            <PersistenceProvider>
                <PrimeReactProvider
                    value={{
                        unstyled: true,
                        pt: {},
                        ptOptions: { mergeSections: true, mergeProps: true, classNameMergeFunction: twMerge },
                    }}
                >
                    {children}
                </PrimeReactProvider>
            </PersistenceProvider>
        </ReduxProvider>
    );
};
