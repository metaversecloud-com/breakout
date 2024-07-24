import difference from "lodash.difference";

function getCombinations(array: string[], size: number) {
  const combinations: string[][] = [];

  function backtrack(startIndex: number, currentCombination: string[]) {
    if (currentCombination.length === size) {
      combinations.push(currentCombination.slice());
      return;
    }

    for (let i = startIndex; i < array.length; i++) {
      currentCombination.push(array[i]);
      backtrack(i + 1, currentCombination);
      currentCombination.pop();
    }
  }

  backtrack(0, []);
  return combinations;
}

function includesAny(arr: string[], elements: string[]) {
  return elements.some((element) => arr.includes(element));
}

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const match = (
  allPossibleMatches: string[][],
  roundNum: number,
  participants: string[],
  matchesObj: Record<string, string[][]>,
) => {
  const allMatches: string[][] = [];

  let temp = [...allPossibleMatches];
  shuffleArray(participants);

  for (let j = 0; j < participants.length; j++) {
    const current = participants[j];
    if (matchesObj[current].length > roundNum - 1) {
      continue;
    }
    if (temp.length === 0) {
      break;
    }

    const allPossibleForCurrent = temp.filter((m) => m.includes(current));
    const allPossibleWithoutDuplicates = allPossibleForCurrent.filter((match) => {
      for (const el of Object.keys(matchesObj)) {
        const allCurrentMatches = matchesObj[el];
        if (allCurrentMatches.includes(match)) {
          return false;
        }
        return true;
      }
    });
    let currentAllPossible = [...allPossibleForCurrent];
    if (allPossibleWithoutDuplicates.length > 0) {
      currentAllPossible = [...allPossibleWithoutDuplicates];
      const allPossibleFilter3 = allPossibleWithoutDuplicates.filter((match) => {
        for (let i = 0; i < match.length; i++) {
          if (
            includesAny(
              matchesObj[match[i]].flat(),
              match.filter((_, index) => index !== i),
            )
          ) {
            return false;
          }
          return true;
        }
      });
      if (allPossibleFilter3.length > 0) {
        currentAllPossible = [...allPossibleFilter3];
      }
    }
    if (currentAllPossible.length === 0) {
      continue;
    }
    temp = difference(temp, currentAllPossible);
    const randomIndex = Math.floor(Math.random() * currentAllPossible.length);
    const match = currentAllPossible.splice(randomIndex, 1)[0];
    match?.forEach((el) => {
      matchesObj[el].push(match.slice());
      const allPossibleForCurrent = temp.filter((m) => m.includes(el));
      temp = difference(temp, allPossibleForCurrent);
    });
    allMatches.push(match.slice());
    if (allMatches.length === 16) {
      break;
    }
  }

  return { allMatches, matchesObj };
};

export { getCombinations, match };
