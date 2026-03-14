export const OWNERSHIP_MEDIUM = ["PHYSICAL", "DIGITAL"] as const;
export const OWNERSHIP_STATUS = ["ACTIVE", "BACKLOG", "PAUSED", "COMPLETED", "SOLD", "TRADED", "ARCHIVED"] as const;
export const PLAY_STATUS = ["UNPLAYED", "PLAYING", "COMPLETED", "ON_HOLD", "DROPPED"] as const;

export type OwnershipMedium = (typeof OWNERSHIP_MEDIUM)[number];
export type OwnershipStatus = (typeof OWNERSHIP_STATUS)[number];
export type PlayStatus = (typeof PLAY_STATUS)[number];
