import { Breakouts } from "../../controllers/session/handleSetBreakoutConfig.js";
import { getCombinations, match } from "../arrangement.js";

export default function getMatches(init: boolean, assetId: string, participants: string[], breakouts: Breakouts) {
  participants.forEach((el) => {
    if (init || !breakouts[assetId].data.matchesObj[el]) {
      breakouts[assetId].data.matchesObj[el] = [];
    }
  });
  const numOfGroups = breakouts[assetId].data.numOfGroups;
  const allCombinations = getCombinations(
    participants,
    Math.max((participants.length - (participants.length % numOfGroups)) / numOfGroups, 2),
  );
  const data = match(
    allCombinations,
    breakouts[assetId].data.round,
    participants,
    breakouts[assetId].data.matchesObj,
    numOfGroups,
  );
  const leftOut = participants.filter((el) => !data.allMatches.flat().includes(el));

  // Distribute leftovers round-robin across the groups we actually formed.
  // Guarded: if match() produced zero groups (all participants exhausted their
  // pairings) there's nowhere to put leftovers, so skip.
  const groupCount = data.allMatches.length;
  if (groupCount > 0) {
    leftOut.forEach((el, i) => {
      const targetGroup = i % groupCount;
      breakouts[assetId].data.matchesObj[el].push([...data.allMatches[targetGroup], el]);
      data.allMatches[targetGroup].forEach((p) => {
        breakouts[assetId].data.matchesObj[p][breakouts[assetId].data.matchesObj[p].length - 1].push(el);
      });
      data.allMatches[targetGroup].push(el);
    });
  }

  breakouts[assetId].data.matchesObj = data.matchesObj;
  return data.allMatches;
}
