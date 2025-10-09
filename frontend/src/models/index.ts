import { Models } from '@rematch/core';
import { raids } from './raids';

export interface RootModel extends Models<RootModel> {
    raids: typeof raids;
}

export const models: RootModel = {
    raids,
};
