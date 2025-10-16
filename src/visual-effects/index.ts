import { VisualEffectFactory } from '@/visual-effect';

import { limitCut } from './ffxiv/limit-cut';
import { lineAttack } from './ffxiv/line-attack';
import { radialAttack } from './ffxiv/radial-attack';
import { targetRing } from './ffxiv/target-ring';
import { waymark } from './ffxiv/waymark';

export const visualEffectFactories: Record<string, VisualEffectFactory> = {
    'ffxiv-waymark': waymark,
    'ffxiv-limit-cut': limitCut,
    'ffxiv-radial-attack': radialAttack,
    'ffxiv-line-attack': lineAttack,
    'ffxiv-target-ring': targetRing,
};
