import * as core from '@diffusionstudio/core';
import { useEffect, useRef, useState } from 'react';

import { Button, Dialog, Dropdown, NumberInput, RGBInput } from '@/components';
import { usePersistentState, useScene, useSceneWorkspace, useSelection } from '@/hooks';
import { shapeDimensions } from '@/models/raids/utils';
import { useSceneRenderer } from '@/renderer';
import { useSelector } from '@/store';
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
    const renderer = useSceneRenderer(sceneId);
    const selection = useSelection(scene?.raidId);

    const [renderType, setRenderType] = usePersistentState<'png' | 'mp4'>('render-type', 'png');
    const [backgroundColor, setBackgroundColor] = usePersistentState('render-background-color', {
        r: 20,
        g: 20,
        b: 20,
    });
    const [margin, setMargin] = usePersistentState('render-margin', 1);
    const [pixelsPerMeter, setPixelsPerMeter] = usePersistentState('render-pixels-per-meter', 40);
    const [fps, setFps] = usePersistentState('render-fps', 60);
    const [aspectRatio, setAspectRatio] = usePersistentState('render-aspect-ratio', 1);
    const [defaultStepDuration, setDefaultStepDuration] = usePersistentState('render-default-step-duration', 5000);
    const [steps, setSteps] = usePersistentState<'all' | 'current' | 'selected'>('render-steps', 'current');

    const allSteps = useSelector((state) => state.raids.steps);

    const sortedSelectionStepIds = [...(selection?.stepIds || [])].sort((a, b) => {
        const stepA = scene?.stepIds.indexOf(a) ?? -1;
        const stepB = scene?.stepIds.indexOf(b) ?? -1;
        return stepA - stepB;
    });

    const renderStepIds =
        renderType === 'mp4'
            ? steps === 'current'
                ? [stepId || '']
                : steps === 'all'
                  ? scene?.stepIds || []
                  : sortedSelectionStepIds
            : [stepId || ''];

    const renderStepDurations = renderStepIds.map((id) => {
        const step = allSteps[id];
        return step?.renderDuration ?? defaultStepDuration;
    });

    const stepForFrame = (frame: number) => {
        const t = (frame / fps) * 1000;
        let accumulated = 0;
        for (let i = 0; i < renderStepDurations.length; i++) {
            accumulated += renderStepDurations[i];
            if (t < accumulated) {
                return renderStepIds[i];
            }
        }
        return renderStepIds[renderStepIds.length - 1];
    };

    const isSeamlessLoop = renderStepIds.length === 1;
    const stepsDurationSum = renderStepDurations.reduce((a, b) => a + b, 0);

    const renderDuration = isSeamlessLoop
        ? Math.ceil(stepsDurationSum / LoopDuration.Full) * LoopDuration.Full
        : stepsDurationSum;

    const previewStepId = renderStepIds[0];

    useEffect(() => {
        if (!scene || !stepId) {
            onClose();
        }
    }, [scene, stepId, onClose]);

    const sceneDimensions = scene ? shapeDimensions(scene.shape) : { width: 10, height: 10 };
    const sceneWidth = sceneDimensions.width + margin * 2;
    const sceneHeight = sceneDimensions.height + margin * 2;

    let pixelWidth = Math.round(sceneWidth * pixelsPerMeter);
    let pixelHeight = Math.round(sceneHeight * pixelsPerMeter);
    // expand to match aspect ratio
    if (pixelWidth / pixelHeight < aspectRatio) {
        pixelWidth = Math.round(pixelHeight * aspectRatio);
    } else {
        pixelHeight = Math.round(pixelWidth / aspectRatio);
    }

    useEffect(() => {
        const updatePreview = () => {
            if (canvasRef.current && renderer && !pausePreviewRendering.current) {
                canvasRef.current.width = pixelWidth;
                canvasRef.current.height = pixelHeight;
                const canvasContext = canvasRef.current.getContext('2d');
                if (canvasContext && previewStepId) {
                    renderer.update(previewStepId, 0);
                    renderer.render(canvasContext, pixelsPerMeter, { now: 0, backgroundColor });
                }
            }
        };
        updatePreview();

        const interval = setInterval(updatePreview, 500);
        return () => clearInterval(interval);
    }, [renderer, pixelWidth, pixelHeight, pixelsPerMeter, backgroundColor, previewStepId]);

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
                const frames = Math.round((renderDuration / 1000) * fps);

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
                        renderer.update(stepForFrame(i), now);
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
            <div className="flex flex-row gap-2">
                <NumberInput label="Margin" value={margin} onChange={setMargin} />
                <NumberInput label="Aspect Ratio" value={aspectRatio} onChange={setAspectRatio} maxFractionDigits={4} />
                <NumberInput label="Pixels/Meter" value={pixelsPerMeter} onChange={setPixelsPerMeter} />
            </div>
            {renderType === 'mp4' && (
                <div className="flex flex-row gap-2">
                    <Dropdown
                        options={[
                            { label: 'All', key: 'all' },
                            { label: 'Current', key: 'current' },
                            { label: 'Selected', key: 'selected' },
                        ]}
                        label="Steps"
                        selectedOptionKey={steps}
                        onChange={(option) => setSteps(option.key as 'all' | 'current' | 'selected')}
                    />
                    <NumberInput
                        label="Default Step Duration (ms)"
                        value={defaultStepDuration}
                        onChange={setDefaultStepDuration}
                    />
                    <NumberInput label="FPS" value={fps} onChange={setFps} />
                </div>
            )}
            <div className="relative border border-white/20 flex flex-col">
                <canvas
                    className="bg-black/10"
                    style={{
                        aspectRatio: `${pixelWidth} / ${pixelHeight}`,
                    }}
                    ref={canvasRef}
                />
                <div
                    className={`absolute bottom-0 left-0 bg-cyan-500 h-1 ${isBusy ? '' : 'hidden'}`}
                    style={{ width: `${progress * 100}%` }}
                ></div>
            </div>
            <div className="text-xs text-center text-white/80">
                {pixelWidth}×{pixelHeight}px
                {renderType === 'mp4' ? `, ${renderDuration / 1000}s${isSeamlessLoop ? ' (seamless loop)' : ''}` : ''}
            </div>
            <div className="flex flex-row justify-end">
                <Button text="Render" disabled={isBusy} onClick={render} />
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
