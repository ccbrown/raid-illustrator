'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useHashParam } from '@/hooks';
import { useDispatch, usePersistence, useSelector } from '@/store';

import { CommandsProvider } from '../commands';
import { Canvas } from './Canvas';
import { EntitiesPanel } from './EntitiesPanel';
import { InspectorPanel } from './InspectorPanel';
import { MenuBar } from './MenuBar';
import { ScenesPanel } from './ScenesPanel';
import { StepsPanel } from './StepsPanel';

export const Editor = () => {
    const router = useRouter();
    const raidId = useHashParam('id');
    const persistence = usePersistence();
    const raidExists = useSelector((state) => (raidId ? !!state.raids.metadata[raidId] : false));

    useEffect(() => {
        const persist = async () => {
            if (raidId) {
                await persistence.persistRaid(raidId);
                await persistence.persistRaidWorkspace(raidId);
            }
        };

        window.addEventListener('beforeunload', persist);
        const timer = setInterval(persist, 2000);

        return () => {
            window.removeEventListener('beforeunload', persist);
            clearInterval(timer);
        };
    }, [raidId, persistence]);

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
                            <div className="flex flex-col gap-4 w-80 [&>*]:pointer-events-auto">
                                <ScenesPanel />
                                <StepsPanel />
                            </div>
                            <div className="flex-grow" />
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-row">
                                    <div className="flex-grow" />
                                    <div className="pointer-events-auto w-80">
                                        <EntitiesPanel />
                                    </div>
                                </div>
                                <div className="flex-grow" />
                                <div className="pointer-events-auto min-h-0">
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
