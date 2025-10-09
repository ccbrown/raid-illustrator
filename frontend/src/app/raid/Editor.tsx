'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { EntitiesPanel } from './EntitiesPanel';
import { ScenesPanel } from './ScenesPanel';
import { StepsPanel } from './StepsPanel';
import { MenuBar } from './MenuBar';
import { useHashParam } from '@/hooks';
import { useDispatch, useSelector } from '@/store';

export const Editor = () => {
    const router = useRouter();
    const raidId = useHashParam('id');
    const raidExists = useSelector((state) => (raidId ? !!state.raids.metadata[raidId] : false));

    useEffect(() => {
        if (!raidExists) {
            // do an extra check to make absolutely sure we have the most up-to-date raid id. the
            // order of state updates when navigating can cause issues otherwise
            const currentParams = new URLSearchParams(window.location.hash.slice(1));
            const currentRaidId = currentParams.get('id');
            if (!currentRaidId || raidId === currentRaidId) {
                router.push('/');
            }
        }
    }, [raidExists, raidId, router]);

    const dispatch = useDispatch();

    useEffect(() => {
        if (raidId) {
            dispatch.workspaces.open({ id: raidId });
        }
    }, [raidId]);

    return (
        <div className="relative w-full h-full">
            <div className="absolute inset-0 flex flex-col">
                <MenuBar />
                <div className="flex flex-row gap-4 p-4">
                    <div className="flex flex-col gap-4 w-64">
                        <ScenesPanel />
                        <StepsPanel />
                    </div>
                    <div className="flex-grow" />
                    <div className="flex flex-col gap-4 w-64">
                        <EntitiesPanel />
                    </div>
                </div>
            </div>
        </div>
    );
};
