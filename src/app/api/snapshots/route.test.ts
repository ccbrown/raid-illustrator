import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedRaid } from '@/models/raids/types';
import { UserFacingError } from '@/snapshots';
import { createSnapshot } from '@/snapshots';

import { POST } from './route';
import type { PostSnapshotRequestBody } from './route';

// Mock the snapshots module
vi.mock('@/snapshots', () => ({
    createSnapshot: vi.fn(),
    UserFacingError: class UserFacingError extends Error {
        constructor(message: string) {
            super(message);
            this.name = 'UserFacingError';
        }
    },
}));

describe('POST /api/snapshots', () => {
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

    it('should successfully create a snapshot and return its id', async () => {
        const raid = createValidRaid();
        const expectedId = 'test-snapshot-id-123';

        vi.mocked(createSnapshot).mockResolvedValue(expectedId);

        const requestBody: PostSnapshotRequestBody = { raid };
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(createSnapshot).toHaveBeenCalledWith(raid);
        expect(createSnapshot).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(200);
        expect(data).toEqual({ id: expectedId });
    });

    it('should return 400 for validation errors from createSnapshot', async () => {
        const raid = createValidRaid();
        raid.scenes = []; // Invalid: no scenes

        const errorMessage = 'Raid must have at least one scene.';
        vi.mocked(createSnapshot).mockRejectedValue(new UserFacingError(errorMessage));

        const requestBody: PostSnapshotRequestBody = { raid };
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const text = await response.text();

        expect(createSnapshot).toHaveBeenCalledWith(raid);
        expect(response.status).toBe(400);
        expect(text).toBe(errorMessage);
    });

    it('should return 400 for size limit errors from createSnapshot', async () => {
        const raid = createValidRaid();
        const errorMessage =
            "Snapshot size 6.00 MB exceeds limit of 5 MB. If you're using embedded images, consider uploading them to an external hosting service.";

        vi.mocked(createSnapshot).mockRejectedValue(new UserFacingError(errorMessage));

        const requestBody: PostSnapshotRequestBody = { raid };
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const text = await response.text();

        expect(createSnapshot).toHaveBeenCalledWith(raid);
        expect(response.status).toBe(400);
        expect(text).toBe(errorMessage);
    });

    it('should handle invalid JSON in request body', async () => {
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json',
        });

        await expect(POST(request)).rejects.toThrow();
    });

    it('should handle different raid configurations', async () => {
        const raid = createValidRaid();
        // Add more scenes, steps, and entities
        raid.scenes.push({
            id: 'scene2',
            raidId: 'raid1',
            name: 'Second Scene',
            shape: { type: 'circle', radius: 300 },
            stepIds: ['step2'],
            entityIds: ['entity2'],
        });
        raid.steps.push({
            id: 'step2',
            raidId: 'raid1',
            sceneId: 'scene2',
            name: 'Second Step',
            renderDuration: 1000,
        });
        raid.entities.push({
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
        });

        const expectedId = 'complex-raid-id-456';
        vi.mocked(createSnapshot).mockResolvedValue(expectedId);

        const requestBody: PostSnapshotRequestBody = { raid };
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(createSnapshot).toHaveBeenCalledWith(raid);
        expect(response.status).toBe(200);
        expect(data).toEqual({ id: expectedId });
    });

    it('should propagate non-UserFacingError exceptions', async () => {
        const raid = createValidRaid();
        const unexpectedError = new Error('Database connection failed');

        vi.mocked(createSnapshot).mockRejectedValue(unexpectedError);

        const requestBody: PostSnapshotRequestBody = { raid };
        const request = new Request('http://localhost/api/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        await expect(POST(request)).rejects.toThrow('Database connection failed');
    });
});
