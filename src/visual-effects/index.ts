import { VisualEffectFactory } from '@/visual-effect';

import { limitCut } from './ffxiv/limit-cut';
import { lineAttack } from './ffxiv/line-attack';
import { radialAttack } from './ffxiv/radial-attack';
import { statusEffects } from './ffxiv/status-effects';
import { targetRing } from './ffxiv/target-ring';
import { tether } from './ffxiv/tether';
import { waymark } from './ffxiv/waymark';
import { nameText } from './name-text';
import { text } from './text';

export const visualEffectFactories: Record<string, VisualEffectFactory> = {
    'ffxiv-waymark': waymark,
    'ffxiv-limit-cut': limitCut,
    'ffxiv-radial-attack': radialAttack,
    'ffxiv-line-attack': lineAttack,
    'ffxiv-status-effects': statusEffects,
    'ffxiv-target-ring': targetRing,
    'ffxiv-tether': tether,
    text: text,
    'name-text': nameText,
};
