'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Canvas } from './Canvas';
import { CommandsProvider } from './commands';
import { EntitiesPanel } from './EntitiesPanel';
import { InspectorPanel } from './InspectorPanel';
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
    }, [raidId, dispatch]);

    return (
        <CommandsProvider>
            <div className="flex flex-col w-full h-screen">
                <div className="flex flex-col h-full">
                    <MenuBar />
                    <div className="relative flex flex-grow overflow-hidden">
                        <div className="absolute inset-0">
                            <Canvas />
                        </div>
                        <div className="absolute inset-0 flex flex-row gap-4 p-4 pointer-events-none">
                            <div className="flex flex-col gap-4 w-64 [&>*]:pointer-events-auto">
                                <ScenesPanel />
                                <StepsPanel />
                            </div>
                            <div className="flex-grow" />
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-row">
                                    <div className="flex-grow" />
                                    <div className="pointer-events-auto w-64">
                                        <EntitiesPanel />
                                    </div>
                                </div>
                                <div className="flex-grow" />
                                <div className="pointer-events-auto">
                                    <InspectorPanel />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CommandsProvider>
    );
};
