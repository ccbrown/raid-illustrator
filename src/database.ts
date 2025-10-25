import { IDBPDatabase, openDB } from 'idb';

import { PersistedRaid } from '@/models/raids/types';
import { PersistedRaidWorkspace } from '@/models/workspaces/types';

export class Database {
    private db: IDBPDatabase;

    constructor(db: IDBPDatabase) {
        this.db = db;
    }

    static async open(): Promise<Database> {
        const db = await openDB('raid-illustrator', 2, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('raids')) {
                    db.createObjectStore('raids', { keyPath: 'metadata.id' });
                }
                if (!db.objectStoreNames.contains('workspaces')) {
                    db.createObjectStore('workspaces', { keyPath: 'raid.id' });
                }
            },
        });
        return new Database(db);
    }

    // Deletes the raid and its workspace.
    async deleteRaid(id: string) {
        const tx = this.db.transaction(['raids', 'workspaces'], 'readwrite');
        const raidsStore = tx.objectStore('raids');
        const workspacesStore = tx.objectStore('workspaces');
        await raidsStore.delete(id);
        await workspacesStore.delete(id);
        await tx.done;
    }

    async putRaid(raid: PersistedRaid) {
        const tx = this.db.transaction('raids', 'readwrite');
        const store = tx.objectStore('raids');
        await store.put(raid);
        await tx.done;
    }

    async getRaids(): Promise<PersistedRaid[]> {
        const tx = this.db.transaction('raids', 'readonly');
        const store = tx.objectStore('raids');
        const raids = await store.getAll();
        await tx.done;
        return raids;
    }

    async putRaidWorkspace(workspace: PersistedRaidWorkspace) {
        const tx = this.db.transaction('workspaces', 'readwrite');
        const store = tx.objectStore('workspaces');
        await store.put(workspace);
        await tx.done;
    }

    async getRaidWorkspaces(): Promise<PersistedRaidWorkspace[]> {
        const tx = this.db.transaction('workspaces', 'readonly');
        const store = tx.objectStore('workspaces');
        const workspaces = await store.getAll();
        await tx.done;
        return workspaces;
    }
}
