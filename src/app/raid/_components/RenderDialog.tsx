import * as core from '@diffusionstudio/core';
import { useEffect, useRef, useState } from 'react';

import { Button, Dialog, Dropdown, NumberInput, RGBInput } from '@/components';
import { usePersistentState, useScene, useSceneWorkspace } from '@/hooks';
import { shapeDimensions } from '@/models/raids/utils';
import { useSceneRenderer } from '@/renderer';
import { LoopDuration } from '@/visual-effect';

interface RenderDialogContentProps {
    sceneId: string;
    onClose: () => void;
}

const RenderDialogContent = ({ sceneId, onClose }: RenderDialogContentProps) => {
    const pausePreviewRendering = useRef(false);
    const [isBusy, setIsBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scene = useScene(sceneId);
    const sceneWorkspace = useSceneWorkspace(sceneId);
    const stepId = sceneWorkspace?.openStepId;
    const renderer = useSceneRenderer(sceneId, stepId || '');

    const [renderType, setRenderType] = usePersistentState<'png' | 'mp4'>('render-type', 'png');
    const [backgroundColor, setBackgroundColor] = usePersistentState('render-background-color', {
        r: 20,
        g: 20,
        b: 20,
    });
    const [margin, setMargin] = usePersistentState('render-margin', 1);
    const [pixelsPerMeter, setPixelsPerMeter] = usePersistentState('render-pixels-per-meter', 40);
    const [fps, setFps] = usePersistentState('render-fps', 60);

    useEffect(() => {
        if (!scene || !stepId) {
            onClose();
        }
    }, [scene, stepId, onClose]);

    const sceneDimensions = scene ? shapeDimensions(scene.shape) : { width: 10, height: 10 };
    const renderWidth = sceneDimensions.width + margin * 2;
    const renderHeight = sceneDimensions.height + margin * 2;
    const pixelWidth = Math.round(renderWidth * pixelsPerMeter);
    const pixelHeight = Math.round(renderHeight * pixelsPerMeter);

    useEffect(() => {
        const updatePreview = () => {
            if (canvasRef.current && renderer && !pausePreviewRendering.current) {
                canvasRef.current.width = pixelWidth;
                canvasRef.current.height = pixelHeight;
                const canvasContext = canvasRef.current.getContext('2d');
                if (canvasContext) {
                    renderer.render(canvasContext, pixelsPerMeter, { now: 0, backgroundColor });
                }
            }
        };
        updatePreview();

        const interval = setInterval(updatePreview, 500);
        return () => clearInterval(interval);
    }, [renderer, pixelWidth, pixelHeight, pixelsPerMeter, backgroundColor]);

    const render = async () => {
        if (isBusy || !scene || !canvasRef.current || !renderer) {
            return;
        }
        setIsBusy(true);
        setProgress(0);

        const filename = scene.name.replace(/[\/\?<>\\:\*\|":]/g, '');

        switch (renderType) {
            case 'png': {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvasRef.current.toDataURL('image/png');
                link.click();
                break;
            }
            case 'mp4': {
                const frames = Math.round((LoopDuration.Full / 1000) * fps);

                const composition = new core.Composition({
                    width: pixelWidth,
                    height: pixelHeight,
                });
                composition.duration = core.Timestamp.fromFrames(frames, fps);

                pausePreviewRendering.current = true;
                const canvasContext = canvasRef.current.getContext('2d');
                if (canvasContext) {
                    for (let i = 0; i < frames; i++) {
                        canvasRef.current.width = pixelWidth;
                        canvasRef.current.height = pixelHeight;
                        const now = (i / fps) * 1000;
                        renderer.render(canvasContext, pixelsPerMeter, { now, backgroundColor });
                        const url = canvasRef.current.toDataURL('image/png');
                        await composition.add(new core.ImageClip(url, { delay: i, duration: 1 }));
                        setProgress((i + 1) / frames);
                    }
                }
                pausePreviewRendering.current = false;

                const encoder = new core.Encoder(composition, {
                    audio: {
                        enabled: false,
                    },
                    video: {
                        fps,
                    },
                });
                await encoder.render(`${filename}.mp4`);
                break;
            }
        }

        setIsBusy(false);
    };

    return (
        <div className="flex flex-col gap-4">
            <Dropdown
                options={[
                    { label: 'MP4', key: 'mp4' },
                    { label: 'PNG', key: 'png' },
                ]}
                label="Type"
                selectedOptionKey={renderType}
                onChange={(option) => setRenderType(option.key as 'png' | 'mp4')}
            />
            <RGBInput label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
            <div className="grid grid-cols-3 gap-2">
                <NumberInput label="Margin (m)" value={margin} onChange={setMargin} />
                <NumberInput label="Pixels/Meter" value={pixelsPerMeter} onChange={setPixelsPerMeter} />
                {renderType === 'mp4' && (
                    <div className="flex flex-row justify-end">
                        <NumberInput label="FPS" value={fps} onChange={setFps} />
                    </div>
                )}
            </div>
            <canvas
                className="border border-white/20 bg-black/10"
                style={{
                    aspectRatio: `${renderWidth} / ${renderHeight}`,
                }}
                ref={canvasRef}
            />
            <div className="text-xs text-center text-white/80">
                {pixelWidth}×{pixelHeight}px
                {renderType === 'mp4' ? `, ${LoopDuration.Full / 1000}s (seamless loop)` : ''}
            </div>
            <div className="flex flex-row justify-end">
                <Button
                    text={isBusy ? `${Math.round(progress * 100)}%` : 'Render'}
                    disabled={isBusy}
                    onClick={render}
                />
            </div>
        </div>
    );
};

interface Props {
    isOpen?: boolean;
    sceneId: string;
    onClose: () => void;
}

export const RenderDialog = (props: Props) => {
    return (
        <Dialog isOpen={props.isOpen} onClose={() => props.onClose()} title="Render Scene">
            <RenderDialogContent onClose={() => props.onClose()} sceneId={props.sceneId} />
        </Dialog>
    );
};
