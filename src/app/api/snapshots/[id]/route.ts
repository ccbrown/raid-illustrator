import { PersistedRaid } from '@/models/raids/types';
import { getSnapshot } from '@/snapshots';

export interface GetSnapshotResponseBody {
    raid: PersistedRaid;
}

export async function GET(_req: Request, ctx: RouteContext<'/api/snapshots/[id]'>) {
    const { id } = await ctx.params;
    const snapshot = await getSnapshot(id);
    if (!snapshot) {
        return new Response('No such snapshot.', { status: 404 });
    }
    const body: GetSnapshotResponseBody = {
        raid: snapshot,
    };
    return Response.json(body);
}
