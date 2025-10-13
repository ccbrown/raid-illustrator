import { VisualEffectFactory } from '@/visual-effect';

import { limitCut } from './ffxiv/limit-cut';
import { targetRing } from './ffxiv/target-ring';
import { waymark } from './ffxiv/waymark';

export const visualEffectFactories: Record<string, VisualEffectFactory> = {
    'ffxiv-waymark': waymark,
    'ffxiv-limit-cut': limitCut,
    'ffxiv-target-ring': targetRing,
};
