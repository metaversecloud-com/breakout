import { INTERACTIVE_SECRET } from "../../constants";
import { expect, test } from "../../fixtures";
import { COUNTDOWN_S, activeData, awaitFreshLockBucket, config, seedBreakout, waitingData } from "./breakoutWorld";

// Running breakouts live in server memory keyed by the key asset's id: give every world its own.
test.use({ uniqueAssetId: true });

const ISSUE = "EXP-466";

test.describe("session locks", () => {
  // Start and reset both write the data object under the lock `${assetId}_<current 10s bucket>` with
  // releaseLock: false, and ignore the write's result (Promise.allSettled). The second write in the same
  // bucket gets a 409, but the route still answers success.
  test("ending a breakout right after starting it really ends it", async ({ request, world }) => {
    test.fail(true, `${ISSUE}: start's lock is never released, so a reset within 10s is silently dropped`);
    await seedBreakout(world, { isAdmin: true });
    await awaitFreshLockBucket();

    expect((await request.post(world.api("/set-config"), { data: config() })).ok()).toBe(true);
    const reset = await request.post(world.api("/reset"));

    expect(reset.ok()).toBe(true);
    expect((await world.assetData(world.assetId)).status).toBe("waiting");
  });

  test("starting again right after ending records the new breakout", async ({ request, world }) => {
    test.fail(true, `${ISSUE}: reset's lock is never released, so a start within 10s is silently dropped`);
    await seedBreakout(world, { isAdmin: true, assetData: activeData() });
    await awaitFreshLockBucket();

    expect((await request.post(world.api("/reset"))).ok()).toBe(true);
    const start = await request.post(world.api("/set-config"), { data: config({ numOfRounds: 4 }) });

    expect(start.ok()).toBe(true);
    expect(await world.assetData(world.assetId)).toMatchObject({ status: "active", numOfRounds: 4 });
  });

  test("a start whose write fails isn't reported as started", async ({ request, world }) => {
    test.fail(true, `${ISSUE}: start ignores a failed data-object write and answers success`);
    await seedBreakout(world, { isAdmin: true, failures: { "/update-data-object": 500 } });

    const response = await request.post(world.api("/set-config"), { data: config() });

    expect((await world.assetData(world.assetId)).status).toBe("waiting");
    expect(response.ok()).toBe(false);
  });
});

test.describe("double start", () => {
  test("a second start while a breakout runs is refused", async ({ request, world }) => {
    test.fail(true, `${ISSUE}: nothing stops a second start; both breakouts' timers run`);
    test.slow();
    await seedBreakout(world, { isAdmin: true, players: 3 });

    const first = await request.post(world.api("/set-config"), { data: config() });
    const second = await request.post(world.api("/set-config"), { data: config() });

    expect(first.ok()).toBe(true);
    // Either refuse the second start, or at least run one breakout: one round-start celebration and one
    // move per player after the countdown.
    await new Promise((resolve) => setTimeout(resolve, (COUNTDOWN_S + 1) * 1000));
    expect((await world.events("set-activity")).length).toBe(1);
    expect((await world.events("move")).length).toBe(4);
    expect(second.ok()).toBe(false);
  });
});

test.describe("failing Topia calls", () => {
  test("a failing Topia call answers an error without leaking the secret", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, failures: { "/drop-scene": 500 } });

    const response = await request.post(world.api("/replace-scene"), { data: { key: "STONE_SM" } });

    expect(response.status()).toBe(500);
    const body = await response.text();
    expect(JSON.parse(body).success).toBe(false);
    for (const marker of [INTERACTIVE_SECRET, "interactiveSecret", "InteractiveJWT", "interactiveJWT"]) {
      expect(body, `response contains "${marker}"`).not.toContain(marker);
    }
  });

  test("a scene swap that can't drop the new scene leaves the old one in place", async ({ request, world }) => {
    test.fail(true, `${ISSUE}: the old scene is deleted before the new one is dropped; a failed drop leaves nothing`);
    await seedBreakout(world, { isAdmin: true, failures: { "/drop-scene": 500 } });

    const response = await request.post(world.api("/replace-scene"), { data: { key: "STONE_SM" } });

    expect(response.ok()).toBe(false);
    expect(await world.events("delete-asset")).toEqual([]);
  });

  test("an unreadable key asset fails the session read cleanly", async ({ request, world }) => {
    await seedBreakout(world, { failures: { [`GET /api/v1/world/${world.urlSlug}/assets/${world.assetId}`]: 500 } });

    const response = await request.get(world.api("/data-object"));

    expect(response.status()).toBe(500);
    expect((await response.json()).success).toBe(false);
  });

  test("ending survives a failing drawer close", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, assetData: activeData(), failures: { "/close-iframe": 500 } });

    const response = await request.post(world.api("/reset"));

    expect(response.ok()).toBe(true);
    expect(await world.assetData(world.assetId)).toEqual(waitingData());
  });
});
