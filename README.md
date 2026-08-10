<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Breakout

## Introduction / Summary

Breakout is a session-based small-group facilitation app for Topia worlds. An admin configures a group count, round count, and per-round duration; every visitor standing in the app's landmark zone at start is bucketed into groups and teleported into private zones for each timed round. Between rounds the arrangement algorithm avoids pairing visitors who already shared a group, so participants meet different people every round.

Admins can also swap the on-canvas breakout scene from a curated set of env-var-gated presets (Stone / Color / Wood in small and large layouts) without leaving the app — the swap deletes the current scene's assets, drops the new scene at a container-anchored position, and re-drops the app's key asset.

## Key Features

### Canvas elements & interactions

- **Key asset:** clicking it opens the drawer for visitors and admins.
- **Landmark zone:** the "lobby" where visitors gather before a session starts. Identified by the SDK's `isLandmarkZoneEnabled` flag on a dropped asset; its id is cached on the key-asset data object as `landmarkZoneId`.
- **Private zones:** the per-group meeting rooms. Identified by the SDK's `isPrivateZone` flag on dropped assets in the scene. The count of private zones caps `numOfGroups`.
- **`Breakout_container` asset (optional):** used by the admin scene-swap to anchor the new scene's drop position. Falls back to the key asset's position if absent.

### Drawer content

- Participant count (live, refreshed by the "refresh" icon).
- Session config form (groups, rounds, minutes/seconds per round, include-admins toggle).
- Active-session view (per-round countdown + "next round in 10s" screen).
- Admin scene-swap panel (see below).

### Admin features

- **Access:** anyone whose `visitor.isAdmin` is true.
- **Configure & start:** admins pick `numOfGroups` (capped at private-zone count), `numOfRounds` (max 25), per-round duration (10s min, 10min max), and whether to include admins in the groupings. Requires ≥2 participants in the landmark zone to start.
- **Reset:** wipes the session data object, closes iframes for all participants, and ends the session in memory.
- **Scene swap:** pick one of the enabled presets (below) and replace the world's Breakout scene without leaving the app. Under the hood: (1) delete every sibling of the key asset in the current scene drop, (2) drop the new scene at the `Breakout_container`'s position (fallback: key asset's position), (3) close the iframe for the calling admin, (4) delete the original key asset last so the platform re-runs its setup webhook with the new scene.

### Themes / Scene presets

Presets are defined in [`server/utils/sceneCatalog.ts`](server/utils/sceneCatalog.ts) and matched to preview images in [`client/src/components/AdminView.tsx`](client/src/components/AdminView.tsx). Only presets whose `SCENE_ID_<KEY>` env var is set at runtime appear in the picker.

| Key        | Title         | Env var             |
| ---------- | ------------- | ------------------- |
| `STONE_SM` | Stone - Small | `SCENE_ID_STONE_SM` |
| `STONE_LG` | Stone - Large | `SCENE_ID_STONE_LG` |
| `COLOR_SM` | Color - Small | `SCENE_ID_COLOR_SM` |
| `COLOR_LG` | Color - Large | `SCENE_ID_COLOR_LG` |
| `WOOD_SM`  | Wood - Small  | `SCENE_ID_WOOD_SM`  |
| `WOOD_LG`  | Wood - Large  | `SCENE_ID_WOOD_LG`  |

Adding a preset requires a row in `SCENE_CATALOG` + the `SCENE_ID_*` env var + a `client/src/assets/<KEY>.jpg` preview + an entry in `PREVIEWS` in `AdminView.tsx`.

## Required Assets with Unique Names

| Unique Name          | Required | Description                                                                                      |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `Breakout_container` | No       | Anchors the position for scene swaps. If absent, the swap uses the key asset's position instead. |

> The key asset itself is identified by `credentials.assetId` (the asset the visitor clicked), not by unique name. The landmark zone and private zones are identified by SDK flags (`isLandmarkZoneEnabled`, `isPrivateZone`) — no unique-name lookup.

## Technical Architecture

### Data Objects

#### Key Asset (`BreakoutDataObject`)

The only persistent data-object surface this app writes.

```ts
{
  participants: string[];      // profileIds in the landmark zone at session start
                               //   (also refreshed live by GET /api/data-object)
  landmarkZoneId: string;      // Persisted after first initialization
  numOfRounds: number;
  secondsPerRound: number;
  startTime: number;           // ms epoch of session start
  status: "waiting" | "active";
}
```

#### Visitor / World

Not used. All ephemeral round state (group matches, current round index, timeouts, admin credentials) lives in the in-memory `breakouts` map keyed by `keyAsset.id` — it is lost on server restart.

## API Endpoints

Routes mount under `/api` and `/webhook`.

| Method | Route                                 | Auth  | Description                                                                                                                        |
| ------ | ------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/`                               | —     | Sanity check.                                                                                                                      |
| `GET`  | `/api/system/health`                  | —     | Version + env-var status.                                                                                                          |
| `GET`  | `/api/system/interactive-credentials` | —     | Validates public key/JWT.                                                                                                          |
| `GET`  | `/api/is-admin`                       | —     | Returns `{ isAdmin }` for the calling visitor.                                                                                     |
| `GET`  | `/api/data-object`                    | —     | Returns the key-asset data object with a fresh `participants` list from the landmark zone.                                         |
| `GET`  | `/api/get-participants`               | Admin | Returns `[{ profileId, username }]` for the current landmark-zone occupants.                                                       |
| `POST` | `/api/set-config`                     | Admin | Starts a breakout session. Body: `numOfGroups`, `numOfRounds`, `minutes`, `seconds`, `includeAdmins`. Rejects if < 2 participants. |
| `POST` | `/api/reset`                          | Admin | Resets the data object, closes iframes for participants, ends the session in memory.                                               |
| `POST` | `/api/close-iframe`                   | —     | Closes the calling visitor's iframe.                                                                                               |
| `GET`  | `/api/scenes`                         | Admin | Returns `{ key, title }` for every preset whose `SCENE_ID_*` env var is set.                                                       |
| `POST` | `/api/replace-scene`                  | Admin | Body: `{ key }`. Wipes the scene, drops the picked preset, closes iframe, deletes the key asset last.                              |
| `POST` | `/webhook/enter-zone`                 | —     | Landmark-zone webhook: refreshes cached admin credentials so an admin who re-enters mid-session can keep the timer running.        |
| `POST` | `/webhook/setup`                      | —     | Scene-setup webhook: marks all assets in the scene drop as interactive.                                                            |

**Configuration limits:** `numOfRounds ≤ 25`, per-round duration `10s ≤ d ≤ 600s`, `numOfGroups ≤ private-zone count`, min 2 participants.

## Analytics

All events fire via `keyAsset.updateDataObject({ analytics: [...] })` in [`handleSetBreakoutConfig.ts`](server/controllers/session/handleSetBreakoutConfig.ts).

| Event                         | Fired when                                                                       | Frequency                                 |
| ----------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| `starts`                      | Session starts successfully.                                                     | Once per session.                         |
| `groupConfigOf${numOfGroups}` | Session starts.                                                                  | Once per session, per group-count bucket. |
| `rounds`                      | Session starts, then again at the top of every subsequent round.                 | Once per round.                           |
| `groupsOf${match.length}`     | For each formed group at session start and each round.                           | Once per group per round.                 |
| `joinRound`                   | Per included visitor (profileId as `uniqueKey`) at session start and each round. | Once per included visitor per round.      |

No analytics on `/reset`, `/close-iframe`, or `/replace-scene`.

## Environment Variables

Env is loaded from `../.env` (root of the repo). Create a `.env` at the repo root; see `.env-example` for a template.

| Variable             | Description                                                                                                        | Required |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| `INTERACTIVE_KEY`    | Topia interactive app key. Checked on boot.                                                                        | Yes      |
| `INTERACTIVE_SECRET` | Topia interactive app secret. Checked on boot.                                                                     | Yes      |
| `INSTANCE_DOMAIN`    | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging, `public-dev.topia.io` for dev). | Yes      |
| `INSTANCE_PROTOCOL`  | `https` for production/staging, `http` only for local.                                                             | Yes      |
| `APP_URL`            | Base URL passed to `visitor.openIframe` (the URL the drawer iframe loads).                                         | Yes      |
| `SCENE_ID_STONE_SM`  | Scene id for the "Stone – Small" preset. Enable the preset by setting this.                                        | No       |
| `SCENE_ID_STONE_LG`  | Scene id for "Stone – Large".                                                                                      | No       |
| `SCENE_ID_COLOR_SM`  | Scene id for "Color – Small".                                                                                      | No       |
| `SCENE_ID_COLOR_LG`  | Scene id for "Color – Large".                                                                                      | No       |
| `SCENE_ID_WOOD_SM`   | Scene id for "Wood – Small".                                                                                       | No       |
| `SCENE_ID_WOOD_LG`   | Scene id for "Wood – Large".                                                                                       | No       |
| `PORT`               | Express port (defaults to `3000`).                                                                                 | No       |
| `NODE_ENV`           | `development` skips real `openIframe`/`closeIframe` calls and enables dev CORS.                                    | No       |
| `COMMIT_HASH`        | Surfaced in `/system/health` for deploy tracking.                                                                  | No       |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install
cd client && npm install && cd ..

# create a .env at the root (see Environment Variables above)
cp .env-example .env

# run the dev server (client + server together)
npm run dev
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Arrangement algorithm** ([`server/utils/arrangement.ts`](server/utils/arrangement.ts) + [`server/utils/session/getMatches.ts`](server/utils/session/getMatches.ts)): enumerates all size-`k` subsets where `k = floor(N/G)` (min 2), then greedily picks groups avoiding profileIds that already shared a group in previous rounds. Leftovers (`N % G`) are distributed round-robin. `maxMatches` is capped at `numOfGroups`.
- **Private-zone shuffling** ([`placeVisitors.ts`](server/utils/session/placeVisitors.ts)): zones are shuffled before assignment; each visitor gets ±0–20 pixels of jitter around the zone center. `privateZoneUserCap` is set to `floor(N/G) + 1` per zone.
- **Round countdown:** a 10-second "next round" screen renders before each teleport; `pastelConfetti_fall` particle fires at teleport.
- **Solo-admin gotcha (fixed):** `fetchVisitorsInZone` calls in `handleSetBreakoutConfig` pass `shouldIncludeAdminPermissions: true` so a solo-admin test still sees themselves in the participant list. `handleGetDataObject`, `handleGetParticipantsInZone`, and `handleResetSession` intentionally do **not** — they use the caller's own permissions.
- **Admin identity refresh:** if the running admin's `interactiveNonce` changes mid-session (they re-entered the world), the `/webhook/enter-zone` handler updates the cached credentials so subsequent round ticks use the fresh nonce.
- **In-memory-only session state:** timers, current round, match history, admin credentials live in the process-scoped `breakouts` map. A server restart mid-session ends every active session immediately.
- **Dev iframe no-op:** `openIframeForVisitors` and `closeIframeForVisitors` short-circuit when `NODE_ENV === "development"` so hot-reload doesn't kill iframes.
- **`cleanReturnPayload` middleware** strips sensitive fields from every JSON response.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/breakout-dev), [Prod](https://topia.io/breakout-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Breakout-e7db52d106324b6eb26e76b4836ee59b?v=71f6c3828d3b4f33960326f9bde24781)
