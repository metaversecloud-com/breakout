import { SCENE_DROP_ID, VISITOR_ID, expect, test } from "../../fixtures";
import {
  CONTAINER_ID,
  CONTAINER_POSITION,
  COUNTDOWN_S,
  PRIVATE_ZONES,
  ZONE_ID,
  ZONE_POSITIONS,
  activeData,
  config,
  seedBreakout,
  waitingData,
} from "./breakoutWorld";

// Running breakouts live in server memory keyed by the key asset's id: give every world its own.
test.use({ uniqueAssetId: true });

test.describe("starting a breakout", () => {
  test("marks the session active, opens the drawer for everyone in the area and logs the analytics", async ({
    request,
    world,
  }) => {
    await seedBreakout(world, { isAdmin: true, players: 3, otherVisitors: { 201: { inZone: false } } });

    const response = await request.post(world.api("/set-config"), { data: config({ numOfRounds: 3, seconds: 45 }) });

    expect(response.status()).toBe(200);
    const { success, startTime } = await response.json();
    expect(success).toBe(true);
    const data = await world.assetData(world.assetId);
    expect(data).toMatchObject({
      status: "active",
      numOfRounds: 3,
      secondsPerRound: 45,
      startTime,
      landmarkZoneId: ZONE_ID,
    });
    // Everyone standing in the breakout area, the admin included (includeAdmins), nobody outside it.
    expect([...data.participants].sort()).toEqual(
      [world.profileId, ...[101, 102, 103].map((id) => world.player(id).profileId)].sort(),
    );
    const opened = await world.events("open-iframe");
    expect(opened.map((e) => Number(e.visitorId)).sort((a, b) => a - b)).toEqual([VISITOR_ID, 101, 102, 103]);
    expect(opened[0]).toMatchObject({
      droppedAssetId: world.assetId,
      link: "http://breakout.e2e.invalid/",
      shouldOpenInDrawer: true,
      title: "Breakout",
    });
    await expect
      .poll(async () => (await world.events("analytics")).map((a) => a.analyticName).sort())
      .toEqual(["groupConfigOf2", "groupsOf2", "joinRound", "joinRound", "joinRound", "joinRound", "rounds", "starts"]);
  });

  test("after the countdown, splits players into private zones and celebrates", async ({ request, world }) => {
    test.slow();
    await seedBreakout(world, { isAdmin: true, players: 3 });

    expect((await request.post(world.api("/set-config"), { data: config({ numOfGroups: 2 }) })).ok()).toBe(true);
    expect(await world.events("move")).toEqual([]);

    await expect.poll(async () => (await world.events("move")).length, { timeout: (COUNTDOWN_S + 5) * 1000 }).toBe(4);
    const moves = await world.events("move");
    expect(moves.every((m) => m.teleport === true)).toBe(true);
    // Each player lands within 20 units of one of the scene's private zones; two groups of two.
    const zoneOf = (m: Record<string, any>) =>
      PRIVATE_ZONES.find(
        (id) => Math.abs(m.moveTo.x - ZONE_POSITIONS[id].x) <= 20 && Math.abs(m.moveTo.y - ZONE_POSITIONS[id].y) <= 20,
      );
    const groups = Object.values(
      moves.reduce<Record<string, number[]>>((acc, m) => {
        (acc[zoneOf(m) ?? "none"] ||= []).push(Number(m.visitorId));
        return acc;
      }, {}),
    );
    expect(groups.map((g) => g.length).sort()).toEqual([2, 2]);
    expect(moves.map(zoneOf)).not.toContain(undefined);
    const zonesSet = await world.events("set-private-zone");
    expect(zonesSet).toHaveLength(2);
    // Players go to the zones that were set up for their group.
    expect(new Set(moves.map(zoneOf))).toEqual(new Set(zonesSet.map((e) => e.assetId)));
    expect(zonesSet[0]).toMatchObject({ isPrivateZone: true, isPrivateZoneChatDisabled: false, privateZoneUserCap: 3 });
    expect((await world.events("particles")).map((p) => p.particleName)).toEqual(["pastelConfetti_fall"]);
    expect(await world.events("set-activity")).toEqual([
      expect.objectContaining({ webhookType: "GAME_ON", assetId: world.assetId }),
    ]);
  });

  test("never forms more groups than the scene has private zones", async ({ request, world }) => {
    test.slow();
    await seedBreakout(world, { isAdmin: true, players: 7, privateZones: PRIVATE_ZONES.slice(0, 2) });

    expect((await request.post(world.api("/set-config"), { data: config({ numOfGroups: 4 }) })).ok()).toBe(true);

    await expect.poll(async () => (await world.events("move")).length, { timeout: (COUNTDOWN_S + 5) * 1000 }).toBe(8);
    const zonesSet = await world.events("set-private-zone");
    expect(new Set(zonesSet.map((e) => e.assetId))).toEqual(new Set(PRIVATE_ZONES.slice(0, 2)));
    expect(await world.events("analytics")).toContainEqual(expect.objectContaining({ analyticName: "groupConfigOf2" }));
  });

  test("leaves admins out when includeAdmins is off", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 2, otherVisitors: { 150: { isAdmin: true } } });

    const response = await request.post(world.api("/set-config"), {
      data: config({ numOfGroups: 1, includeAdmins: false }),
    });

    expect(response.ok()).toBe(true);
    const { participants } = await world.assetData(world.assetId);
    expect([...participants].sort()).toEqual([101, 102].map((id) => world.player(id).profileId).sort());
  });

  test("caps the number of rounds at 25", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true });

    expect((await request.post(world.api("/set-config"), { data: config({ numOfRounds: 99 }) })).ok()).toBe(true);

    expect((await world.assetData(world.assetId)).numOfRounds).toBe(25);
  });

  const invalid: Array<[string, Record<string, unknown>]> = [
    ["rounds shorter than 10 seconds", { minutes: 0, seconds: 9 }],
    ["rounds longer than 10 minutes", { minutes: 10, seconds: 1 }],
    ["zero rounds", { numOfRounds: 0 }],
    ["zero groups", { numOfGroups: 0 }],
    ["a non-numeric time", { minutes: "soon" }],
  ];
  for (const [name, overrides] of invalid) {
    test(`rejects ${name}`, async ({ request, world }) => {
      await seedBreakout(world, { isAdmin: true });

      const response = await request.post(world.api("/set-config"), { data: config(overrides) });

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ message: "Invalid configuration" });
      expect(await world.assetData(world.assetId)).toEqual(waitingData());
      expect(await world.events("open-iframe")).toEqual([]);
    });
  }

  test("needs at least two participants", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 2 });

    const response = await request.post(world.api("/set-config"), {
      data: config({ includeAdmins: false, numOfGroups: 1 }),
    });
    expect(response.ok()).toBe(true);

    await seedBreakout(world, { isAdmin: true, players: 1 });
    const lonely = await request.post(world.api("/set-config"), {
      data: config({ includeAdmins: false, numOfGroups: 1 }),
    });
    expect(lonely.status()).toBe(400);
    expect(await lonely.json()).toEqual({ message: "Not enough participants" });
    expect((await world.assetData(world.assetId)).status).toBe("waiting");
  });

  test("needs private zones in the scene", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, privateZones: [] });

    const response = await request.post(world.api("/set-config"), { data: config() });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ message: "No private zones configured in this scene" });
  });
});

test.describe("ending a breakout", () => {
  test("resets the session and closes everyone else's drawer", async ({ request, world }) => {
    await seedBreakout(world, {
      isAdmin: true,
      players: 2,
      otherVisitors: { 201: { inZone: false } },
      assetData: activeData({ participants: ["someone"] }),
    });

    const response = await request.post(world.api("/reset"));

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      dataObject: waitingData({
        participants: [world.profileId, world.player(101).profileId, world.player(102).profileId],
      }),
    });
    expect(await world.assetData(world.assetId)).toEqual(waitingData());
    // The admin's own drawer stays open (they're looking at it); players outside the area aren't touched.
    expect((await world.events("close-iframe")).map((e) => Number(e.visitorId)).sort()).toEqual([101, 102]);
  });

  test("stops the round timers, so nobody is moved after the end", async ({ request, world }) => {
    test.slow();
    await seedBreakout(world, { isAdmin: true, players: 3 });
    expect((await request.post(world.api("/set-config"), { data: config() })).ok()).toBe(true);

    expect((await request.post(world.api("/reset"))).ok()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, (COUNTDOWN_S + 1) * 1000));
    expect(await world.events("move")).toEqual([]);
    expect(await world.events("particles")).toEqual([]);
  });
});

test.describe("reading the session", () => {
  test("initializes a fresh key asset with the scene's landmark zone", async ({ request, world }) => {
    await seedBreakout(world, { assetData: {} });

    const response = await request.get(world.api("/data-object"));

    expect(response.status()).toBe(200);
    const participants = [world.profileId, ...[101, 102, 103].map((id) => world.player(id).profileId)];
    expect({ ...(await response.json()), participants: [] }).toEqual(waitingData());
    expect([...(await response.json()).participants].sort()).toEqual(participants.sort());
    expect(await world.assetData(world.assetId)).toEqual(waitingData());
  });

  test("counts only the players standing in the breakout area", async ({ request, world }) => {
    await seedBreakout(world, { players: 2, inZone: false, otherVisitors: { 201: { inZone: false } } });

    const { participants } = await (await request.get(world.api("/data-object"))).json();

    expect([...participants].sort()).toEqual([101, 102].map((id) => world.player(id).profileId).sort());
  });

  test("admins can list the participants with their usernames", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 1, otherVisitors: { 201: { inZone: false } } });

    const response = await request.get(world.api("/get-participants"));

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(
      expect.arrayContaining([
        { profileId: world.profileId, username: "e2e-player" },
        { profileId: world.player(101).profileId, username: "player-101" },
      ]),
    );
    expect(await response.json()).toHaveLength(2);
  });

  test("tells admins from players", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: false });
    expect(await (await request.get(world.api("/is-admin"))).json()).toEqual({ isAdmin: false });

    await seedBreakout(world, { isAdmin: true });
    expect(await (await request.get(world.api("/is-admin"))).json()).toEqual({ isAdmin: true });
  });
});

test.describe("admin-only routes", () => {
  const adminRoutes: Array<[string, string, Record<string, unknown>?]> = [
    ["post", "/set-config", config()],
    ["post", "/reset"],
    ["get", "/get-participants"],
    ["get", "/scenes"],
    ["post", "/replace-scene", { key: "STONE_SM" }],
  ];
  for (const [method, path, data] of adminRoutes) {
    test(`${method.toUpperCase()} ${path} refuses players`, async ({ request, world }) => {
      await seedBreakout(world, { isAdmin: false, assetData: activeData() });

      const response = await request[method as "get" | "post"](world.api(path), data ? { data } : {});

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ message: "Unauthorized. User is not an admin." });
      expect((await world.assetData(world.assetId)).status).toBe("active");
      expect((await world.events()).filter((e) => e.type !== "analytics")).toEqual([]);
    });
  }
});

test.describe("scenes", () => {
  test("lists only the presets whose scene id is configured", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true });

    const response = await request.get(world.api("/scenes"));

    expect(await response.json()).toEqual({
      success: true,
      scenes: [
        { key: "STONE_SM", title: "Stone - Small" },
        { key: "WOOD_LG", title: "Wood - Large" },
      ],
    });
    expect(JSON.stringify(await response.json())).not.toContain("scene-stone-sm");
  });

  test("swapping replaces the scene's assets and drops the new scene on the container", async ({ request, world }) => {
    await seedBreakout(world, { isAdmin: true, extraAssets: { "unrelated-asset": { id: "unrelated-asset" } } });

    const response = await request.post(world.api("/replace-scene"), { data: { key: "WOOD_LG" } });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    const deleted = (await world.events("delete-asset")).map((e) => e.assetId).sort();
    expect(deleted).toEqual([CONTAINER_ID, ZONE_ID, ...PRIVATE_ZONES, world.assetId].sort());
    expect(await world.events("drop-scene")).toEqual([
      expect.objectContaining({
        sceneId: "scene-wood-lg",
        sceneDropId: SCENE_DROP_ID,
        allowNonAdmins: true,
        position: { x: CONTAINER_POSITION.x - 30, y: CONTAINER_POSITION.y - 70 },
      }),
    ]);
    expect(await world.events("close-iframe")).toEqual([
      expect.objectContaining({ visitorId: String(VISITOR_ID), droppedAssetId: world.assetId }),
    ]);
    expect(Object.keys((await world.state()).assets)).toContain("unrelated-asset");
  });

  const badKeys: Array<[string, Record<string, unknown>]> = [
    ["no key", {}],
    ["an unknown key", { key: "LAVA_XL" }],
    ["a preset without a configured scene id", { key: "COLOR_SM" }],
  ];
  for (const [name, data] of badKeys) {
    test(`swapping with ${name} changes nothing`, async ({ request, world }) => {
      await seedBreakout(world, { isAdmin: true });

      const response = await request.post(world.api("/replace-scene"), { data });

      expect(response.status()).toBe(400);
      expect((await response.json()).success).toBe(false);
      expect(await world.events("delete-asset")).toEqual([]);
      expect(await world.events("drop-scene")).toEqual([]);
    });
  }
});

test.describe("webhooks and drawer", () => {
  test("setup makes every asset of the scene interactive with the app's key", async ({ request, world }) => {
    await seedBreakout(world, {
      extraAssets: { "other-scene-asset": { id: "other-scene-asset", sceneDropId: "scene-2" } },
    });

    const response = await request.post("/webhook/setup", {
      data: Object.fromEntries(world.credentials()),
    });

    expect(response.status()).toBe(200);
    const settings = await world.events("set-asset-interactive-settings");
    expect(settings.map((e) => e.assetId).sort()).toEqual(
      [CONTAINER_ID, ZONE_ID, ...PRIVATE_ZONES, world.assetId].sort(),
    );
    expect(settings[0]).toMatchObject({ isInteractive: true, interactivePublicKey: "e2e-public-key" });
  });

  test("close-iframe closes the caller's drawer", async ({ request, world }) => {
    await seedBreakout(world);

    expect((await request.post(world.api("/close-iframe"))).ok()).toBe(true);

    expect(await world.events("close-iframe")).toEqual([
      expect.objectContaining({ visitorId: String(VISITOR_ID), droppedAssetId: world.assetId }),
    ]);
  });
});
