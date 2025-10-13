import { Models } from '@rematch/core';

import { raids } from './raids';
import { workspaces } from './workspaces';

export interface RootModel extends Models<RootModel> {
    raids: typeof raids;
    workspaces: typeof workspaces;
}

export const models: RootModel = {
    raids,
    workspaces,
};
