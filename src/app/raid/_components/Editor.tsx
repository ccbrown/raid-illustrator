'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { GetSnapshotResponseBody } from '@/app/api/snapshots/[id]/route';
import { ErrorMessage } from '@/components';
import { useHashParam } from '@/hooks';
import { useDispatch, usePersistence, useSelector } from '@/store';

import { CommandsProvider } from '../commands';
import { Canvas } from './Canvas';
import { EntitiesPanel } from './EntitiesPanel';
import { InspectorPanel } from './InspectorPanel';
import { MenuBar } from './MenuBar';
import { ScenesPanel } from './ScenesPanel';
import { StepsPanel } from './StepsPanel';

interface EditorContextValue {
    raidId: string;
    isReadOnly?: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

const EditorProvider = EditorContext.Provider;

export const useEditor = (): EditorContextValue => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an Editor');
    }
    return context;
};

const EditorImpl = ({ raidId, isReadOnly }: { raidId: string; isReadOnly?: boolean }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (raidId) {
            dispatch.workspaces.open({ id: raidId });
        }
    }, [raidId, dispatch]);

    return (
        <EditorProvider value={{ raidId, isReadOnly }}>
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
                                {!isReadOnly && (
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CommandsProvider>
        </EditorProvider>
    );
};

const LocalRaid = ({ raidId }: { raidId: string }) => {
    const router = useRouter();
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

    return <EditorImpl raidId={raidId} />;
};

const Snapshot = ({ id }: { id: string }) => {
    const dispatch = useDispatch();
    const [raidId, setRaidId] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const loadingRaidId = useRef('');

    useEffect(() => {
        const loadSnapshot = async () => {
            try {
                const response = await fetch(`/api/snapshots/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('This link has expired. Please ask the owner to share a new one.');
                    } else if (response.status === 400) {
                        throw new Error(await response.text());
                    }
                    throw new Error(response.statusText);
                }
                const data = (await response.json()) as GetSnapshotResponseBody;
                const raid = await dispatch.raids.importPersistedRaid(data.raid);
                setRaidId(raid.id);
            } catch (err) {
                setErrorMessage((err as Error).message || 'An unknown error occurred');
            }
        };

        if (id && loadingRaidId.current !== id) {
            loadingRaidId.current = id;
            loadSnapshot();
        }
    }, [id, dispatch]);

    useEffect(() => {
        if (raidId) {
            return () => {
                dispatch.raids.delete({ id: raidId });
                dispatch.workspaces.delete({ raidId });
            };
        }
    }, [raidId, dispatch]);

    if (raidId) {
        return <EditorImpl raidId={raidId} isReadOnly />;
    } else if (errorMessage) {
        return (
            <div className="max-w-xl m-auto mt-20 px-4">
                <ErrorMessage>{errorMessage}</ErrorMessage>
            </div>
        );
    }

    return null;
};

export const Editor = () => {
    const router = useRouter();
    const localRaidId = useHashParam('id');
    const snapshotId = useHashParam('s');

    useEffect(() => {
        // the specific components will handle cases where the raid/snapshot doesn't exist, but we
        // should check here for the case where neither id is present
        const currentParams = new URLSearchParams(window.location.hash.slice(1));
        if (!currentParams.get('id') && !currentParams.get('s')) {
            router.push('/');
        }
    }, [router]);

    if (localRaidId) {
        return <LocalRaid raidId={localRaidId} />;
    } else if (snapshotId) {
        return <Snapshot id={snapshotId} />;
    } else {
        return null;
    }
};
