'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { getPersistor } from '@rematch/persist';
import { PersistGate } from 'redux-persist/integration/react';
import { PrimeReactProvider } from 'primereact/api';
import { twMerge } from 'tailwind-merge';

import { store } from '@/store';

const persistor = getPersistor();

export const Providers = ({ children }: PropsWithChildren) => {
    useServerInsertedHTML(() => {
        return <></>;
    });

    return (
        <ReduxProvider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <PrimeReactProvider
                    value={{
                        unstyled: true,
                        pt: {},
                        ptOptions: { mergeSections: true, mergeProps: true, classNameMergeFunction: twMerge },
                    }}
                >
                    {children}
                </PrimeReactProvider>
            </PersistGate>
        </ReduxProvider>
    );
};
