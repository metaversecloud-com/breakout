import { VISITOR_ID, expect, test } from "../../fixtures";
import { press } from "../../helpers/press";
import { COUNTDOWN_S, activeData, seedBreakout, waitingData } from "./breakoutWorld";

// Running breakouts live in server memory keyed by the key asset's id: give every world its own. The admin
// cog is an SDK-style CDN icon. The SDK stylesheet is aborted too, so the confirmation modal doesn't overlay
// the fixed "Start Breakout" bar: its buttons are pressed with press().
test.use({ uniqueAssetId: true, stubSdkIcons: true });

test.describe("players", () => {
  test("wait for the admin, without any admin controls", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: false });

    await page.goto(world.url());

    await expect(page.getByRole("heading", { name: "Breakout" })).toBeVisible();
    await expect(page.getByText("Waiting for admin to configure breakout...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Breakout" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open admin settings" })).toHaveCount(0);
  });

  test("see the round they're in while a breakout runs", async ({ page, world }) => {
    // Started 15s ago with 30s rounds: past the 10s countdown, 25s left in round 1 of 3.
    await seedBreakout(world, { assetData: activeData({ startedAgoMs: 15_000, numOfRounds: 3, secondsPerRound: 30 }) });

    await page.goto(world.url());

    await expect(page.getByText("Round 1 of 3")).toBeVisible();
    await expect(page.getByText(/^00:2\d$/)).toBeVisible();
    await expect(page.getByRole("button", { name: "End" })).toHaveCount(0);
  });

  test("see the countdown before a round starts", async ({ page, world }) => {
    await seedBreakout(world, { assetData: activeData({ startedAgoMs: 2_000 }) });

    await page.goto(world.url());

    await expect(page.getByText(/The next round starts in \d+/)).toBeVisible();
  });

  test("see the waiting screen once a breakout has run its course", async ({ page, world }) => {
    // One 30s round started an hour ago, never reset.
    await seedBreakout(world, { assetData: activeData({ startedAgoMs: 3_600_000, numOfRounds: 1 }) });

    await page.goto(world.url());

    await expect(page.getByText("Waiting for admin to configure breakout...")).toBeVisible();
  });

  test("have their drawer closed when the last round ends", async ({ page, world }) => {
    // One 10s round (plus the 10s countdown) that ends 3s from now.
    await seedBreakout(world, {
      assetData: activeData({ startedAgoMs: (10 + COUNTDOWN_S) * 1000 - 3000, numOfRounds: 1, secondsPerRound: 10 }),
    });

    await page.goto(world.url());

    await expect
      .poll(async () => world.events("close-iframe"), { timeout: 8000 })
      .toEqual([expect.objectContaining({ visitorId: String(VISITOR_ID), droppedAssetId: world.assetId })]);
  });

  test("with invalid credentials get the error page", async ({ page, world }) => {
    await seedBreakout(world);

    await page.goto(world.url("/", { interactivePublicKey: "someone-else" }));

    await expect(page.getByRole("heading", { name: "Under Construction" })).toBeVisible();
  });
});

test.describe("admins", () => {
  test("see how many players are in the breakout area and can refresh it", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 2, otherVisitors: { 201: { inZone: false } } });

    await page.goto(world.url());

    await expect(page.getByRole("heading", { name: "Configure Breakout" })).toBeVisible();
    await expect(page.getByText("3 Participants")).toBeVisible();

    const zone = (await world.state()).visitors[101].landmarkZonesString;
    await world.updateVisitor({ landmarkZonesString: zone }, 201);
    await page
      .getByRole("button")
      .filter({ has: page.locator('img[alt="refresh"]') })
      .click();

    await expect(page.getByText("4 Participants")).toBeVisible();
  });

  test("start a breakout after confirming the settings", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 3 });
    await page.goto(world.url());

    await page.locator("#breakout-numOfGroups").fill("2");
    await page.locator("#breakout-numOfRounds").fill("3");
    await page.locator("#breakout-minutes").fill("0");
    await page.locator("#breakout-seconds").fill("45");
    await page.getByLabel("Include Admins in groupings").uncheck();
    await page.getByRole("button", { name: "Start Breakout" }).click();

    const modal = page.locator(".modal");
    await expect(modal.getByText("Number of Participants: 4")).toBeVisible();
    await expect(modal.getByText("Number of Groups: 2")).toBeVisible();
    await expect(modal.getByText("Number of Rounds: 3")).toBeVisible();
    await expect(modal.getByText("Time per Round: 0 min 45 sec")).toBeVisible();
    await expect(modal.getByText("Include Admins: No")).toBeVisible();
    await press(modal.getByRole("button", { name: "Yes" }));

    await expect(page.getByText(/The next round starts in \d+/)).toBeVisible();
    await expect(page.getByRole("button", { name: "End" })).toBeVisible();
    const data = await world.assetData(world.assetId);
    expect(data).toMatchObject({ status: "active", numOfRounds: 3, secondsPerRound: 45 });
    expect(data.participants).not.toContain(world.profileId);
  });

  test("can't confirm a round time outside 10 seconds to 10 minutes", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true });
    await page.goto(world.url());

    await page.locator("#breakout-minutes").fill("0");
    await page.locator("#breakout-seconds").fill("5");
    await page.getByRole("button", { name: "Start Breakout" }).click();

    await expect(page.locator(".modal").getByText("Time per Round: 0 min 5 sec")).toHaveClass(/text-red-500/);
    await expect(page.locator(".modal").getByRole("button", { name: "Yes" })).toBeDisabled();
    await press(page.locator(".modal").getByRole("button", { name: "No" }));
    await expect(page.locator(".modal")).toHaveCount(0);
    expect((await world.assetData(world.assetId)).status).toBe("waiting");
  });

  test("are told why a breakout couldn't start", async ({ page, world }) => {
    test.fail(
      true,
      "EXP-466: a refused start (e.g. not enough participants) shows no message, the modal just stays open",
    );
    await seedBreakout(world, { isAdmin: true, players: 0 });
    await page.goto(world.url());

    await page.getByRole("button", { name: "Start Breakout" }).click();
    await press(page.locator(".modal").getByRole("button", { name: "Yes" }));

    await expect(page.getByText(/not enough participants/i)).toBeVisible({ timeout: 3000 });
  });

  test("end a running breakout and get back to the settings", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true, players: 2, assetData: activeData({ startedAgoMs: 15_000 }) });
    await page.goto(world.url());
    await expect(page.getByText("Round 1 of 2")).toBeVisible();

    await page.getByRole("button", { name: "End" }).click();

    await expect(page.getByRole("heading", { name: "Configure Breakout" })).toBeVisible();
    await expect(page.getByText("3 Participants")).toBeVisible();
    expect(await world.assetData(world.assetId)).toEqual(waitingData());
    expect((await world.events("close-iframe")).map((e) => Number(e.visitorId)).sort((a, b) => a - b)).toEqual([
      101, 102,
    ]);
  });

  test("read the instructions", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true });
    await page.goto(world.url());

    await page.locator('a[href="/instructions"]').click();

    await expect(page.getByRole("heading", { name: "Instructions" })).toBeVisible();
    await expect(page.getByText("The number of rounds is capped at 25.")).toBeVisible();
  });

  test("swap the world's scene from the settings", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true });
    await page.goto(world.url());

    await page.getByRole("button", { name: "Open admin settings" }).click();

    await expect(page.getByRole("heading", { name: "Swap the world scene" })).toBeVisible();
    await expect(page.locator(".card-title")).toHaveText(["Stone - Small", "Wood - Large"]);
    const update = page.getByRole("button", { name: "Update Scene" });
    await expect(update).toBeDisabled();
    await page.getByText("Wood - Large").click();
    await update.click();

    await expect(page.getByText("Scene updated successfully.")).toBeVisible();
    expect(await world.events("drop-scene")).toEqual([expect.objectContaining({ sceneId: "scene-wood-lg" })]);
  });

  test("see the scene swap's error when it fails", async ({ page, world }) => {
    await seedBreakout(world, { isAdmin: true, failures: { "/drop-scene": 500 } });
    await page.goto(world.url());

    await page.getByRole("button", { name: "Open admin settings" }).click();
    await page.getByText("Stone - Small").click();
    await page.getByRole("button", { name: "Update Scene" }).click();

    await expect(page.getByText("Request failed with status code 500")).toBeVisible();
    await expect(page.getByText("Scene updated successfully.")).toHaveCount(0);
  });
});
