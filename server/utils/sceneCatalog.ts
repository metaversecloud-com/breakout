/**
 * Canonical catalog of swappable scenes for the Breakout admin panel.
 *
 * Each entry pairs:
 *  - `key`     — stable client-side identifier used in the request body and
 *                to look up the preview image bundled with the client.
 *  - `title`   — user-facing label rendered under the preview.
 *  - `envVar`  — the env-var name that holds the Topia scene id. If the env
 *                var is unset, the option is filtered out of the response
 *                (and won't appear in the admin UI). This way ops can
 *                enable/disable specific scenes per environment without
 *                touching code.
 *
 * Adding a scene = one row here + a matching env var + a preview image at
 * `client/src/assets/<KEY>.jpg`. Removing = drop the row.
 */
export interface SceneOption {
  key: string;
  title: string;
  envVar: string;
}

export const SCENE_CATALOG: SceneOption[] = [
  { key: "STONE_SM", title: "Stone - Small", envVar: "SCENE_ID_STONE_SM" },
  { key: "STONE_LG", title: "Stone - Large", envVar: "SCENE_ID_STONE_LG" },
  { key: "COLOR_SM", title: "Color - Small", envVar: "SCENE_ID_COLOR_SM" },
  { key: "COLOR_LG", title: "Color - Large", envVar: "SCENE_ID_COLOR_LG" },
  { key: "WOOD_SM", title: "Wood - Small", envVar: "SCENE_ID_WOOD_SM" },
  { key: "WOOD_LG", title: "Wood - Large", envVar: "SCENE_ID_WOOD_LG" },
];

/** Returns only the catalog entries whose backing env var is set at runtime. */
export const getAvailableScenes = (): { key: string; title: string }[] =>
  SCENE_CATALOG.filter((s) => Boolean(process.env[s.envVar])).map(({ key, title }) => ({ key, title }));

/** Resolves a client-supplied `key` to the actual Topia scene id from env. */
export const getSceneIdForKey = (key: string): string | undefined => {
  const entry = SCENE_CATALOG.find((s) => s.key === key);
  if (!entry) return undefined;
  return process.env[entry.envVar];
};
