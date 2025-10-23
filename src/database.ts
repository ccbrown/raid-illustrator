import { IDBPDatabase, openDB } from 'idb';

import { PersistedRaid } from '@/models/raids/types';

export class Database {
    private db: IDBPDatabase;

    constructor(db: IDBPDatabase) {
        this.db = db;
    }

    static async open(): Promise<Database> {
        const db = await openDB('raid-illustrator', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('raids')) {
                    db.createObjectStore('raids', { keyPath: 'metadata.id' });
                }
            },
        });
        return new Database(db);
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
}
