import { getCloudflareContext } from '@opennextjs/cloudflare';

import { PersistedRaid } from '@/models/raids/types';

const SIZE_LIMIT_MB = 10;
const OBJECT_PREFIX = 'snapshots/';

export class UserFacingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserFacingError';
    }
}

// Produces a deterministic id for the given snapshot data.
const snapshotId = async (data: Blob): Promise<string> => {
    const arrayBuffer = await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // use the first half only to shorten the id
    const hashPart = hashArray.slice(0, hashArray.length / 2);
    // base58 encode
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const byte of hashPart) {
        num = (num << BigInt(8)) + BigInt(byte);
    }
    let encoded = '';
    while (num > 0) {
        const remainder = num % BigInt(58);
        num = num / BigInt(58);
        encoded = alphabet[Number(remainder)] + encoded;
    }
    return encoded;
};

const validateRaid = (raid: PersistedRaid) => {
    try {
        if (raid.scenes.length === 0) {
            throw new UserFacingError('Raid must have at least one scene.');
        }

        if (raid.steps.length === 0) {
            throw new UserFacingError('Raid must have at least one step.');
        }

        if (raid.entities.length === 0) {
            throw new UserFacingError('Raid must have at least one entity.');
        }
    } catch {
        throw new UserFacingError('Invalid raid data format.');
    }
};

// Uploads the given raid and returns the id of the new snapshot.
export const createSnapshot = async (raid: PersistedRaid): Promise<string> => {
    validateRaid(raid);

    const serialized = JSON.stringify(raid);

    const encoder = new TextEncoder();
    const data = encoder.encode(serialized);
    const compressionStream = new CompressionStream('gzip');
    const compressedStream = new Blob([data]).stream().pipeThrough(compressionStream);

    const compressedBlob = await new Response(compressedStream).blob();

    const size = compressedBlob.size;
    if (size > SIZE_LIMIT_MB * 1024 * 1024) {
        throw new UserFacingError(
            `Snapshot size ${(size / (1024 * 1024)).toFixed(
                2,
            )} MB exceeds limit of ${SIZE_LIMIT_MB} MB. If you're using embedded images, consider uploading them to an external hosting service.`,
        );
    }

    const id = await snapshotId(compressedBlob);
    await getCloudflareContext().env.R2.put(`${OBJECT_PREFIX}${id}`, compressedBlob, {
        httpMetadata: {
            contentType: 'application/gzip',
        },
    });
    return id;
};

export const getSnapshot = async (id: string): Promise<PersistedRaid | null> => {
    const data = await getCloudflareContext().env.R2.get(`${OBJECT_PREFIX}${id}`);
    if (!data?.body) {
        return null;
    }

    const decompressionStream = new DecompressionStream('gzip');
    const decompressedStream = data.body.pipeThrough(decompressionStream);
    if (!decompressedStream) {
        return null;
    }

    const decompressedBlob = await new Response(decompressedStream).blob();
    const text = await decompressedBlob.text();
    const raid: PersistedRaid = JSON.parse(text);
    return raid;
};
