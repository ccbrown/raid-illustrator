import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedRaid } from '@/models/raids/types';
import { getSnapshot } from '@/snapshots';

import { GET, GetSnapshotResponseBody } from './route';

// Mock the snapshots module
vi.mock('@/snapshots', () => ({
    getSnapshot: vi.fn(),
}));

describe('GET /api/snapshots/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createValidRaid = (): PersistedRaid => ({
        metadata: {
            id: 'raid1',
            name: 'Test Raid',
            creationTime: Date.now(),
            sceneIds: ['scene1'],
        },
        scenes: [
            {
                id: 'scene1',
                raidId: 'raid1',
                name: 'Test Scene',
                shape: { type: 'rectangle', width: 800, height: 600 },
                stepIds: ['step1'],
                entityIds: ['entity1'],
            },
        ],
        steps: [
            {
                id: 'step1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Test Step',
            },
        ],
        entities: [
            {
                id: 'entity1',
                raidId: 'raid1',
                sceneId: 'scene1',
                name: 'Test Entity',
                properties: {
                    type: 'shape',
                    shape: { type: 'circle', radius: 50 },
                    position: { x: 100, y: 100 },
                },
            },
        ],
    });

    const createRouteContext = (id: string) => ({
        params: Promise.resolve({ id }),
    });

    it('should successfully retrieve a snapshot by id', async () => {
        const snapshotId = 'test-snapshot-id-123';
        const expectedRaid = createValidRaid();

        vi.mocked(getSnapshot).mockResolvedValue(expectedRaid);

        const request = new Request(`http://localhost/api/snapshots/${snapshotId}`);
        const context = createRouteContext(snapshotId);

        const response = await GET(request, context);
        const body = (await response.json()) as GetSnapshotResponseBody;

        expect(getSnapshot).toHaveBeenCalledWith(snapshotId);
        expect(getSnapshot).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
        expect(body).toEqual({ raid: expectedRaid });
    });

    it('should return 404 when snapshot does not exist', async () => {
        const snapshotId = 'nonexistent-id';

        vi.mocked(getSnapshot).mockResolvedValue(null);

        const request = new Request(`http://localhost/api/snapshots/${snapshotId}`);
        const context = createRouteContext(snapshotId);

        const response = await GET(request, context);
        const text = await response.text();

        expect(getSnapshot).toHaveBeenCalledWith(snapshotId);
        expect(getSnapshot).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(404);
        expect(text).toBe('No such snapshot.');
    });

    it('should handle different snapshot ids', async () => {
        const snapshotIds = [
            'short-id',
            'very-long-snapshot-id-with-many-characters-123456789',
            'id-with-special-chars-abc123',
            '123456789',
        ];

        for (const snapshotId of snapshotIds) {
            vi.clearAllMocks();
            const expectedRaid = createValidRaid();
            expectedRaid.metadata.id = snapshotId;

            vi.mocked(getSnapshot).mockResolvedValue(expectedRaid);

            const request = new Request(`http://localhost/api/snapshots/${snapshotId}`);
            const context = createRouteContext(snapshotId);

            const response = await GET(request, context);
            const body = (await response.json()) as GetSnapshotResponseBody;

            expect(getSnapshot).toHaveBeenCalledWith(snapshotId);
            expect(response.status).toBe(200);
            expect(body.raid).toEqual(expectedRaid);
        }
    });

    it('should return complex raid data correctly', async () => {
        const snapshotId = 'complex-raid-id';
        const complexRaid = createValidRaid();

        // Add multiple scenes, steps, and entities
        complexRaid.scenes.push({
            id: 'scene2',
            raidId: 'raid1',
            name: 'Second Scene',
            shape: { type: 'circle', radius: 300 },
            fill: {
                type: 'color',
                color: { r: 100, g: 150, b: 200, a: 0.8 },
            },
            stepIds: ['step2', 'step3'],
            entityIds: ['entity2', 'entity3'],
        });

        complexRaid.steps.push(
            {
                id: 'step2',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Second Step',
                renderDuration: 1000,
            },
            {
                id: 'step3',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Third Step',
                renderDuration: 2000,
            },
        );

        complexRaid.entities.push(
            {
                id: 'entity2',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Text Entity',
                properties: {
                    type: 'text',
                    shape: { type: 'rectangle', width: 200, height: 50 },
                    position: { x: 0, y: 0 },
                    content: 'Test Text',
                    color: { r: 255, g: 255, b: 255, a: 1 },
                    outlineColor: { r: 0, g: 0, b: 0, a: 1 },
                    outlineThickness: 2,
                    fontSize: 16,
                    horizontalAlignment: 'center',
                    verticalAlignment: 'middle',
                },
            },
            {
                id: 'entity3',
                raidId: 'raid1',
                sceneId: 'scene2',
                name: 'Group Entity',
                properties: {
                    type: 'group',
                    children: ['entity1', 'entity2'],
                },
            },
        );

        vi.mocked(getSnapshot).mockResolvedValue(complexRaid);

        const request = new Request(`http://localhost/api/snapshots/${snapshotId}`);
        const context = createRouteContext(snapshotId);

        const response = await GET(request, context);
        const body = (await response.json()) as GetSnapshotResponseBody;

        expect(getSnapshot).toHaveBeenCalledWith(snapshotId);
        expect(response.status).toBe(200);
        expect(body.raid).toEqual(complexRaid);
        expect(body.raid.scenes).toHaveLength(2);
        expect(body.raid.steps).toHaveLength(3);
        expect(body.raid.entities).toHaveLength(3);
    });

    it('should handle getSnapshot errors gracefully', async () => {
        const snapshotId = 'error-id';

        vi.mocked(getSnapshot).mockRejectedValue(new Error('R2 connection failed'));

        const request = new Request(`http://localhost/api/snapshots/${snapshotId}`);
        const context = createRouteContext(snapshotId);

        await expect(GET(request, context)).rejects.toThrow('R2 connection failed');
    });
});
