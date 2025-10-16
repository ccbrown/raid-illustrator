import clsx from 'clsx';
import React, { createContext, useContext, useRef, useState } from 'react';

type OnMoveCallback = (movedItemId: string, targetItemId: string, position: 'above' | 'below') => void;

interface SharedData {
    dragItemId?: string;
    onMove?: OnMoveCallback;
}

const SCROLL_LIST_DRAG_MIME_TYPE = 'application/x-raid-illustrator-scroll-list-item';
const SharedDataContext = createContext<SharedData | null>(null);

interface ScrollListItemProps {
    draggable?: boolean;
    id: string;
    children: React.ReactNode;
}

export const ScrollListItem = ({ id, draggable, children }: ScrollListItemProps) => {
    const [showDragIndicatorAbove, setShowDragIndicatorAbove] = useState(false);
    const [showDragIndicatorBelow, setShowDragIndicatorBelow] = useState(false);

    const sharedData = useContext(SharedDataContext);
    if (!sharedData) {
        throw new Error('ScrollListItem must be used within a ScrollList');
    }

    return (
        <div
            className="relative"
            draggable={draggable ? 'true' : undefined}
            onDragStart={(e) => {
                if (draggable) {
                    sharedData.dragItemId = id;
                    e.dataTransfer.setData(SCROLL_LIST_DRAG_MIME_TYPE, id);
                    e.dataTransfer.effectAllowed = 'move';
                }
            }}
            onDragEnd={() => {
                sharedData.dragItemId = undefined;
            }}
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(SCROLL_LIST_DRAG_MIME_TYPE) || !sharedData.dragItemId) {
                    return;
                }

                e.preventDefault();

                const targetRect = (e.target as HTMLElement).getBoundingClientRect();
                const offsetY = e.clientY - targetRect.top;
                if (offsetY < targetRect.height * 0.3) {
                    setShowDragIndicatorAbove(true);
                    setShowDragIndicatorBelow(false);
                } else if (offsetY > targetRect.height * 0.7) {
                    setShowDragIndicatorAbove(false);
                    setShowDragIndicatorBelow(true);
                } else {
                    setShowDragIndicatorAbove(false);
                    setShowDragIndicatorBelow(false);
                }
            }}
            onDragLeave={() => {
                setShowDragIndicatorAbove(false);
                setShowDragIndicatorBelow(false);
            }}
            onDrop={(e) => {
                const itemId = e.dataTransfer.getData(SCROLL_LIST_DRAG_MIME_TYPE);
                if (!itemId || itemId !== sharedData.dragItemId) {
                    return;
                }

                if (showDragIndicatorAbove) {
                    sharedData.onMove?.(itemId, id, 'above');
                } else if (showDragIndicatorBelow) {
                    sharedData.onMove?.(itemId, id, 'below');
                }

                setShowDragIndicatorAbove(false);
                setShowDragIndicatorBelow(false);
            }}
        >
            <div
                className={clsx('absolute left-0 right-0 h-[2px] bg-cyan-500 pointer-events-none', {
                    hidden: !(showDragIndicatorAbove || showDragIndicatorBelow),
                    'top-0 -translate-y-1/2': showDragIndicatorAbove,
                    'bottom-0 translate-y-1/2': showDragIndicatorBelow,
                })}
            />
            {children}
        </div>
    );
};

interface Props {
    children?: React.ReactNode;
    onMove?: OnMoveCallback;
}

export const ScrollList = ({ children, onMove }: Props) => {
    const sharedData = useRef<SharedData>({
        onMove,
    });
    sharedData.current.onMove = onMove;

    return (
        <SharedDataContext.Provider value={sharedData.current}>
            <div className="flex flex-col w-full min-h-0 overflow-y-auto">{children}</div>
        </SharedDataContext.Provider>
    );
};
