import { init, Plugin, RematchDispatch, RematchRootState } from '@rematch/core';
import { produce } from 'immer';
import Redux from 'redux';
import { TypedUseSelectorHook, useDispatch as useDispatchImpl, useSelector as useSelectorImpl } from 'react-redux';
import persistPlugin from '@rematch/persist';
import storage from 'redux-persist/lib/storage';
import { createMigrate } from 'redux-persist';

import { models, RootModel } from './models';

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

const migrations = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    1: (state: any) => ({ ...state, raids: { ...state.raids, scenes: {} } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    2: (state: any) => ({ ...state, raids: { ...state.raids, steps: {} } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    3: (state: any) => ({ ...state, workspaces: { ...state.workspaces, scenes: {} } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    4: (state: any) => ({ ...state, raids: { ...state.raids, entities: {} } }),
};

const persistConfig = {
    key: 'root',
    version: 4,
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
