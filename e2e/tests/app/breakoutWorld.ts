import { SCENE_DROP_ID, TopiaWorld, type OtherVisitor, type SeedOptions } from "../../fixtures";

// A Breakout scene as the app expects it: the key asset, a landmark zone (the breakout area players stand
// in), a container asset the scene swap positions itself on, and private zones players are split into.
export const ZONE_ID = "breakout-landmark-zone";
export const CONTAINER_ID = "breakout-container";
export const PRIVATE_ZONES = ["private-zone-1", "private-zone-2", "private-zone-3", "private-zone-4"];
export const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  "private-zone-1": { x: 100, y: 100 },
  "private-zone-2": { x: 400, y: 100 },
  "private-zone-3": { x: 100, y: 400 },
  "private-zone-4": { x: 400, y: 400 },
};
export const LANDMARK_POSITION = { x: 1000, y: 1000 };
export const CONTAINER_POSITION = { x: 800, y: 600 };
/** Seconds between a round being set up and players being moved (server and client both use 10). */
export const COUNTDOWN_S = 10;

/** The key asset's data object once initialized, before any breakout ran. */
export const waitingData = (extra: Record<string, unknown> = {}) => ({
  participants: [],
  landmarkZoneId: ZONE_ID,
  numOfRounds: 0,
  secondsPerRound: 0,
  startTime: 0,
  status: "waiting",
  ...extra,
});

export type BreakoutSeed = SeedOptions & {
  /** Number of other players standing in the breakout area (visitor ids 101, 102, ...). Default 3. */
  players?: number;
  /** Private zones in the scene. Default all four. */
  privateZones?: string[];
};

/**
 * Seeds a world holding a Breakout scene. Players 101.. stand in the landmark zone; the test's own visitor
 * (42) is in it too unless inZone: false. otherVisitors are merged over the generated players.
 */
export async function seedBreakout(world: TopiaWorld, options: BreakoutSeed = {}) {
  const {
    players = 3,
    privateZones = PRIVATE_ZONES,
    otherVisitors = {},
    extraAssets = {},
    assetData,
    ...rest
  } = options;
  const generated: Record<number, OtherVisitor> = {};
  for (let i = 1; i <= players; i++) generated[100 + i] = {};
  const zones = Object.fromEntries(
    privateZones.map((id) => [
      id,
      {
        id,
        isPrivateZone: true,
        sceneDropId: SCENE_DROP_ID,
        uniqueName: `Breakout_${id}`,
        position: ZONE_POSITIONS[id],
      },
    ]),
  );
  await world.seed({
    ...rest,
    assetData: assetData ?? waitingData(),
    otherVisitors: { ...generated, ...otherVisitors },
    extraAssets: {
      [ZONE_ID]: {
        id: ZONE_ID,
        isLandmarkZoneEnabled: true,
        sceneDropId: SCENE_DROP_ID,
        uniqueName: "Breakout_landmark",
        position: LANDMARK_POSITION,
      },
      [CONTAINER_ID]: {
        id: CONTAINER_ID,
        sceneDropId: SCENE_DROP_ID,
        uniqueName: "Breakout_container",
        position: CONTAINER_POSITION,
      },
      ...zones,
      ...extraAssets,
    },
  });
}

/** A body for POST /set-config. */
export const config = (overrides: Record<string, unknown> = {}) => ({
  numOfGroups: 2,
  numOfRounds: 2,
  minutes: 0,
  seconds: 30,
  includeAdmins: true,
  ...overrides,
});

/** The data object of a breakout that's running: started `startedAgoMs` ago. */
export const activeData = ({
  startedAgoMs = 0,
  numOfRounds = 2,
  secondsPerRound = 30,
  participants = [] as string[],
} = {}) =>
  waitingData({
    participants,
    numOfRounds,
    secondsPerRound,
    startTime: Date.now() - startedAgoMs,
    status: "active",
  });

/**
 * Start and reset take a data-object lock named after the current 10-second bucket
 * (Math.round(now / 10000)). Waits until at least `needMs` remain before the bucket changes, so two calls
 * made now are guaranteed to share it.
 */
export async function awaitFreshLockBucket(needMs = 4000) {
  // Buckets change when now % 10000 crosses 5000 (that's where Math.round flips).
  const untilFlip = () => {
    const phase = Date.now() % 10000;
    return phase < 5000 ? 5000 - phase : 15000 - phase;
  };
  if (untilFlip() < needMs) await new Promise((resolve) => setTimeout(resolve, untilFlip() + 50));
}
