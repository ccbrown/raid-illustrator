import { Plugin, RematchDispatch, RematchRootState, init } from '@rematch/core';
import { produce } from 'immer';
import { createContext, useContext, useEffect, useState } from 'react';
import { TypedUseSelectorHook, useDispatch as useDispatchImpl, useSelector as useSelectorImpl } from 'react-redux';
import Redux from 'redux';

import { Database } from '@/database';
import { RootModel, models } from '@/models';
import { selectPersistedRaid } from '@/models/raids/selectors';

function wrapReducerWithImmer(reducer: Redux.Reducer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (state: any, payload: any): any => {
        if (state === undefined) return reducer(state, payload);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return produce(state, (draft: any) => reducer(draft, payload));
    };
}

const immerPlugin: Plugin<RootModel, RootModel> = {
    onReducer(reducer: Redux.Reducer, _model: string): Redux.Reducer | void {
        return wrapReducerWithImmer(reducer);
    },
};

export const store = init<RootModel, RootModel>({
    models,
    plugins: [immerPlugin],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, RootModel>;

export const useDispatch = () => useDispatchImpl<Dispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorImpl;

export class Persistence {
    private store: Store;
    private database: Database;

    constructor(store: Store, database: Database) {
        this.store = store;
        this.database = database;
    }

    async persistRaid(raidId: string) {
        const raid = selectPersistedRaid(this.store.getState().raids, raidId);
        if (raid) {
            await this.database.putRaid(raid);
        }
    }

    async restoreRaids() {
        const raids = await this.database.getRaids();
        for (const raid of raids) {
            this.store.dispatch.raids.restorePersistedRaid(raid);
        }
    }
}

const PersistenceContext = createContext<Persistence | undefined>(undefined);

export const PersistenceProvider = ({ children }: { children: React.ReactNode }) => {
    const [persistence, setPersistence] = useState<Persistence | undefined>(undefined);
    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        const setupPersistence = async () => {
            const database = await Database.open();
            const persistenceInstance = new Persistence(store, database);
            await persistenceInstance.restoreRaids();
            setPersistence(persistenceInstance);
        };
        setupPersistence();

        const loaderTimer = setTimeout(() => {
            setShowLoader(true);
        }, 300);
        return () => {
            clearTimeout(loaderTimer);
        };
    }, []);

    if (!persistence) {
        if (!showLoader) {
            return null;
        }
        return <div className="w-full h-full flex items-center justify-center opacity-70 text-xs py-8">Loading...</div>;
    }

    return <PersistenceContext.Provider value={persistence}>{children}</PersistenceContext.Provider>;
};

export const usePersistence = (): Persistence => {
    const context = useContext(PersistenceContext);
    if (!context) {
        throw new Error('usePersistence must be used within a PersistenceProvider');
    }
    return context;
};
