import { VisualEffectFactory } from '@/visual-effect';

import * as FfxivWaymarks from './ffxiv/waymarks';

export const visualEffectFactories: Record<string, VisualEffectFactory> = {
    'ffxiv-waymark-a': FfxivWaymarks.waymarkA,
    'ffxiv-waymark-b': FfxivWaymarks.waymarkB,
    'ffxiv-waymark-c': FfxivWaymarks.waymarkC,
    'ffxiv-waymark-d': FfxivWaymarks.waymarkD,
    'ffxiv-waymark-1': FfxivWaymarks.waymark1,
    'ffxiv-waymark-2': FfxivWaymarks.waymark2,
    'ffxiv-waymark-3': FfxivWaymarks.waymark3,
    'ffxiv-waymark-4': FfxivWaymarks.waymark4,
};
