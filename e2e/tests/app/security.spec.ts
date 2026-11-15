import { expect, test } from "../../fixtures";
import { activeData, config, seedBreakout } from "./breakoutWorld";

// Running breakouts live in server memory keyed by the key asset's id: give every world its own.
test.use({ uniqueAssetId: true });

const FOREIGN = "EXP-466: getCredentials never checks interactivePublicKey";
const foreign = { interactivePublicKey: "someone-else" };

test("the session read refuses credentials minted for another app", async ({ request, world }) => {
  test.fail(true, FOREIGN);
  await seedBreakout(world);

  const response = await request.get(world.api("/data-object", foreign));

  expect(response.ok()).toBe(false);
});

test("an admin's credentials minted for another app can't start a breakout", async ({ request, world }) => {
  test.fail(true, FOREIGN);
  await seedBreakout(world, { isAdmin: true });

  const response = await request.post(world.api("/set-config", foreign), { data: config() });

  expect(response.ok()).toBe(false);
  expect((await world.assetData(world.assetId)).status).toBe("waiting");
});

test("an admin's credentials minted for another app can't end a breakout", async ({ request, world }) => {
  test.fail(true, FOREIGN);
  await seedBreakout(world, { isAdmin: true, assetData: activeData() });

  const response = await request.post(world.api("/reset", foreign));

  expect(response.ok()).toBe(false);
  expect((await world.assetData(world.assetId)).status).toBe("active");
});

test("a player can't end a breakout by claiming to be the admin's visitor", async ({ request, world }) => {
  // The admin check reads visitorId from the request; Topia binds the nonce to the visitor, so a player's
  // nonce with the admin's visitorId must not pass. The mock doesn't check that binding: this only pins
  // that the app itself asks Topia rather than trusting a body field.
  await seedBreakout(world, { isAdmin: false, assetData: activeData(), otherVisitors: { 150: { isAdmin: true } } });

  const response = await request.post(world.api("/reset"), { data: { isAdmin: true, visitorId: 150 } });

  expect(response.status()).toBe(401);
  expect((await world.assetData(world.assetId)).status).toBe("active");
});
