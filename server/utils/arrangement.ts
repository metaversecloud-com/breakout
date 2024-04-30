import difference from "lodash.difference";

function getCombinations(array, size) {
  const combinations = [];

  function backtrack(startIndex, currentCombination) {
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

function includesAny(arr, elements) {
  return elements.some(element => arr.includes(element));
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const match = (allPossibleMatches, rounds, initial) => {
  const matchesObj = {};
  const allMatches = Array.from({ length: rounds }, () => []);

  initial.forEach((el) => {
    matchesObj[el] = [];
  });
  debugger;

  for (let i = 0; i < rounds; i++) {
    let temp = [...allPossibleMatches];
    shuffleArray(initial)

    for (let j = 0; j < initial.length; j++) {
      const current = initial[j];
      if (matchesObj[current].length > i) {
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
      })
      debugger;
      let currentAllPossible = [...allPossibleForCurrent];
      if (allPossibleWithoutDuplicates.length > 0) {
        currentAllPossible = [...allPossibleWithoutDuplicates];
        const allPossibleFilter3 = allPossibleWithoutDuplicates.filter((match) => {
          for (let i = 0; i < match.length; i++) {
            if (includesAny(matchesObj[match[i]].flat(), match.filter((el, index) => index !== i))) {
              return false;
            }
            return true;
          }
        })
        if (allPossibleFilter3.length > 0) {
          currentAllPossible = [...allPossibleFilter3];
        }
      }
      temp = difference(temp, currentAllPossible);
      const randomIndex = Math.floor(Math.random() * currentAllPossible.length);
      const match = currentAllPossible.splice(randomIndex, 1)[0];
      match.forEach((el) => {
        matchesObj[el].push(match);
        const allPossibleForCurrent = temp.filter((m) => m.includes(el));
        temp = difference(temp, allPossibleForCurrent);
      })
      allMatches[i].push(match);
    }

  }

  return allMatches;
}

// Example usage:
const array = ["A", "B", 'C', "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const rounds = 3;
const groupSize = 2;

const allCombinations = getCombinations(array, groupSize);
const matches = match(allCombinations, rounds, array);

console.log(matches);

