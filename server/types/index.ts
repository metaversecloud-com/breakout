export * from "./Credentials.js";

export type AnalyticType = {
  analyticName: string;
  incrementBy?: number;
  profileId?: string;
  uniqueKey?: string;
  urlSlug?: string;
};
