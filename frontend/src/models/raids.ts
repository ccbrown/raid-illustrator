import { createModel } from '@rematch/core';

import { RootModel } from '.';

interface RaidMetadata {
    id: string;
    name: string;
    createdAt: number;
}

interface RaidsState {
    metadata: Record<string, RaidMetadata>;
}

export const raids = createModel<RootModel>()({
    state: {
        metadata: {},
    } as RaidsState,
    reducers: {
        putMetadata(state, metadata: RaidMetadata) {
            state.metadata[metadata.id] = metadata;
        },
    },
    effects: (dispatch) => ({
        create(
            payload: {
                name: string;
            },
            _state,
        ) {
            const id = crypto.randomUUID();
            const createdAt = Date.now();
            dispatch.raids.putMetadata({ id, name: payload.name, createdAt });
            return id;
        },
    }),
});
