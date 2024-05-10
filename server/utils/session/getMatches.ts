import { Breakouts } from "../../controllers/session/handleSetBreakoutConfig.js";
import { getCombinations, match } from "../arrangement.js";

export default function getMatches(init: boolean, assetId: string, participants: string[], breakouts: Breakouts) {
  participants?.forEach((el) => {
    if (init || !breakouts[assetId].data.matchesObj[el]) {
      breakouts[assetId].data.matchesObj[el] = [];
    }
  });
  const allCombinations = getCombinations(
    participants,
    Math.max(
      (participants.length - (participants.length % breakouts[assetId].data.numOfGroups)) /
        breakouts[assetId].data.numOfGroups,
      2,
    ),
  );
  const data = match(allCombinations, breakouts[assetId].data.round, participants, breakouts[assetId].data.matchesObj);
  breakouts[assetId].data.matchesObj = data.matchesObj;
  return data.allMatches;
}
