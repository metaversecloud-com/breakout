// Per-app settings for the shared platform tests in tests/platform. Every app edits this file;
// the platform specs themselves stay identical across SDK apps.

/**
 * Bugs a route still has, each set to its tracking reason (e.g. "EXP-429: ..."). The matching
 * platform test is marked test.fail: it passes while the bug exists and fails once it's fixed, so
 * the entry is removed together with the fix. Leave out what the route doesn't have.
 */
export type KnownBugs = {
  /** The response contains the interactive secret or a signed InteractiveJWT. */
  leaksSecret?: string;
  /** A request without session credentials succeeds. */
  acceptsMissingCredentials?: string;
  /** Credentials signed for another app's public key are accepted. */
  acceptsForeignCredentials?: string;
  /** Bad credentials fail later on a Topia call instead of with a credential error. */
  unnamedCredentialError?: string;
  /**
   * A request without session credentials takes the app process down (e.g. getCredentials throws
   * outside any try/catch, and @rtsdk/topia's unhandledRejection hook calls process.exit(1)). The
   * missing-credentials test then runs against a private app instance (helpers/privateServer.ts)
   * instead of the shared one, so it can't kill the server mid-suite, and fails while the bug exists.
   * If the suite collapses with ECONNREFUSED right after a "rejects a request without session
   * credentials" test, that route needs this.
   */
  crashesServer?: string;
};

export type RouteSpec = {
  method: "get" | "post" | "put" | "delete";
  /** Path under basePath, without the query string. */
  path: string;
  /** Where the router is mounted. Default "/api"; e.g. "/webhook" for a separate webhook router. */
  basePath?: string;
  /**
   * Where the route reads the session credentials. "query" (default) is the iframe's backendAPI call.
   * "body": webhooks (asset clicks, zone events) get them as top-level fields of the JSON body, and
   * read them with getCredentials(req.body). The platform tests then merge them into `data`.
   */
  credentialsIn?: "query" | "body";
  /**
   * Body key the route reads the credentials from, for routes that take them nested, e.g.
   * "interactiveParams" for getCredentials(req.body.interactiveParams). Implies credentialsIn: "body".
   */
  credentialsKey?: string;
  /**
   * Query parameters the route needs besides the credentials (GET routes that answer early without them,
   * which would make the secrets scan vacuous).
   */
  query?: Record<string, string>;
  data?: Record<string, unknown>;
  knownBugs?: KnownBugs;
};

// Breakout's getCredentials only checks that the fields are present: it never compares
// interactivePublicKey with INTERACTIVE_KEY (only GET /system/interactive-credentials does), and the SDK
// signs every call with the app's own key, so credentials minted for another app are used as-is.
const FOREIGN_KEY_IGNORED = "EXP-466: getCredentials never checks interactivePublicKey";
const FOREIGN = { acceptsForeignCredentials: FOREIGN_KEY_IGNORED, unnamedCredentialError: FOREIGN_KEY_IGNORED };
// The isAdmin middleware calls getCredentials outside any try/catch: a request without credentials is an
// unhandled rejection and @rtsdk/topia's hook exits the process.
const ADMIN_MIDDLEWARE_CRASH = "EXP-466: isAdmin middleware throws outside try/catch, server exits";
const ADMIN = { ...FOREIGN, crashesServer: ADMIN_MIDDLEWARE_CRASH };

export const CREDENTIALED_ROUTES: RouteSpec[] = [
  { method: "get", path: "/system/interactive-credentials" },
  { method: "get", path: "/is-admin", knownBugs: FOREIGN },
  // Rejects foreign credentials here only because the default world has no Breakout scene (no landmark
  // zone); tests/app/security.spec.ts checks it against a real scene.
  { method: "get", path: "/data-object", knownBugs: { unnamedCredentialError: FOREIGN_KEY_IGNORED } },
  { method: "get", path: "/get-participants", knownBugs: ADMIN },
  {
    method: "post",
    path: "/set-config",
    data: { numOfGroups: 1, numOfRounds: 1, minutes: 0, seconds: 30, includeAdmins: true },
    knownBugs: ADMIN,
  },
  { method: "post", path: "/reset", knownBugs: ADMIN },
  { method: "post", path: "/close-iframe", knownBugs: FOREIGN },
  { method: "get", path: "/scenes", knownBugs: ADMIN },
  { method: "post", path: "/replace-scene", data: { key: "STONE_SM" }, knownBugs: ADMIN },
  { method: "post", path: "/enter-zone", basePath: "/webhook", credentialsIn: "body", knownBugs: FOREIGN },
  {
    method: "post",
    path: "/setup",
    basePath: "/webhook",
    credentialsIn: "body",
    knownBugs: { ...FOREIGN, crashesServer: "EXP-466: /webhook/setup reads credentials outside try/catch, server exits" },
  },
];

/**
 * Page the app opens in its iframe; the platform tests load it with valid credentials. null if the app
 * has no page (no client/, driven only by webhooks): the platform tests that load a page are skipped.
 */
export const ENTRY_PAGE: string | null = "/";

/** Bugs seen when loading ENTRY_PAGE (only leaksSecret applies). */
export const ENTRY_PAGE_KNOWN_BUGS: Pick<KnownBugs, "leaksSecret"> = {};

/** Text the app shell's HTML must contain. Change it if the app isn't a React root (e.g. Unity). */
export const APP_SHELL_MARKER = 'id="root"';

/**
 * Whether unknown paths serve the app shell (an SPA with client-side routing). false for apps with real
 * page routes that answer unknown paths with a proper 404 (e.g. Next.js): the fallback test is skipped.
 */
export const APP_SHELL_FALLBACK: boolean = true;

/**
 * Bugs of the health endpoint (GET /api/system/health), e.g. { incompleteContract: "EXP-123: no
 * COMMIT_HASH/BUILD_TIME in envs" } for apps forked before the contract had them. Marks the contract
 * test test.fail instead of changing app code in the e2e PR.
 */
export const HEALTH_KNOWN_BUGS: { incompleteContract?: string } = {};

/**
 * Bugs of the app process as a whole.
 * exitsOnUnhandledRejection: a promise rejection nobody handles exits the process, so any route that
 * forgets a try/catch lets one request restart the server for every player. @rtsdk/topia registers an
 * unhandledRejection hook that calls process.exit(1) when it's imported, which runs even when the app
 * registers its own logging handler. Fix: process.removeAllListeners("unhandledRejection") before
 * registering the app's handler.
 */
export const PROCESS_KNOWN_BUGS: { exitsOnUnhandledRejection?: string } = {
  exitsOnUnhandledRejection:
    "@rtsdk/topia's unhandledRejection hook calls process.exit(1); server/index.ts's handler doesn't stop it",
};

/**
 * Extra environment for the app under test (merged over the defaults in appEnv.ts; also passed to
 * private instances and the Docker image). A function gets the mock's address as the app reaches it
 * ({ host: "localhost:3101" or "host.docker.internal:3101", url: "http://<host>" }), for fakes of
 * external APIs served by mock-topia. Fake S3 opt-in: { S3_BUCKET: FAKE_S3_BUCKET } (constants.ts).
 * Blank every variable that would point the app at a real service.
 */
export const APP_ENV: Record<string, string> | ((mock: { host: string; url: string }) => Record<string, string>) = {
  // Where openIframe points players' drawers.
  APP_URL: "http://breakout.e2e.invalid/",
  // Two of the six scene presets are configured, so the admin picker lists exactly these.
  SCENE_ID_STONE_SM: "scene-stone-sm",
  SCENE_ID_STONE_LG: "",
  SCENE_ID_COLOR_SM: "",
  SCENE_ID_COLOR_LG: "",
  SCENE_ID_WOOD_SM: "",
  SCENE_ID_WOOD_LG: "scene-wood-lg",
};
