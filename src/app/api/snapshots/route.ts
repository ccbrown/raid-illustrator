import { PersistedRaid } from '@/models/raids/types';
import { UserFacingError, createSnapshot } from '@/snapshots';

export interface PostSnapshotRequestBody {
    raid: PersistedRaid;
}

export interface PostSnapshotResponseBody {
    id: string;
}

export async function POST(req: Request) {
    const body: PostSnapshotRequestBody = await req.json();
    try {
        const id = await createSnapshot(body.raid);
        const output: PostSnapshotResponseBody = { id };
        return Response.json(output);
    } catch (e) {
        if (e instanceof UserFacingError) {
            return new Response(e.message, { status: 400 });
        }
        throw e;
    }
}
