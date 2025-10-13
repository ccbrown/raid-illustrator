import { Plugin, RematchDispatch, RematchRootState, init } from '@rematch/core';
import persistPlugin from '@rematch/persist';
import { produce } from 'immer';
import { TypedUseSelectorHook, useDispatch as useDispatchImpl, useSelector as useSelectorImpl } from 'react-redux';
import Redux from 'redux';
import { createMigrate } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { RootModel, models } from './models';

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

const migrations = {};

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    migrate: createMigrate(migrations, { debug: false }),
};

export const store = init<RootModel, RootModel>({
    models,
    plugins: [immerPlugin, persistPlugin(persistConfig)],
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel, RootModel>;

export const useDispatch = () => useDispatchImpl<Dispatch>();
export const useSelector: TypedUseSelectorHook<RootState> = useSelectorImpl;
