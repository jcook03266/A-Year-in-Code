// Computes and returns the intersection of two sets A and B
export function intersectionSet(setA: Set<any>, setB: Set<any>) {
  let intersectionSet = new Set();

  setB.forEach((element) => {
    setA.has(element) && intersectionSet.add(element);
  });

  return intersectionSet;
}

// Returns the size of the intersection of two sets A and B
export function getSizeOfSetIntersection(setA: Set<any>, setB: Set<any>) {
  return intersectionSet(setA, setB).size;
}

/**
 * Computes the difference between two collections (arrays or sequences of
 * like elements)
 *
 * @param collection_1
 * @param collection_2
 *
 * @returns -> A sequence containing the difference between the two collections
 * aka the elements that both don't have in common
 */
export function computeCollectionDifference<T>(
  collection_1: Array<T>,
  collection_2: Array<T>
): Array<T> {
  let collection_1_count = collection_1.length,
    collection_2_count = collection_2.length,
    largerCollection =
      collection_1_count > collection_2_count ? collection_1 : collection_2,
    smallerCollection =
      collection_1_count > collection_2_count ? collection_2 : collection_1;

  // Determine if the smaller collection contains any elements of the larger collection
  // covering all possible areas in this 'universe'
  return largerCollection.filter(
    (element) => !smallerCollection.includes(element)
  );
}

/**
 * @param collection_1
 * @param collection_2
 *
 * @returns -> True if the collections share no differences meaning that
 * they share the exact same elements independent of ordering, false otherwise
 */
export function areCollectionsEqual<T>(
  collection_1: Array<T>,
  collection_2: Array<T>
): boolean {
  return computeCollectionDifference(collection_1, collection_2).length === 0;
}

// Function to calculate Levenshtein distance between two sequences (strings)
export function computeLevenshteinDistance(str1: string, str2: string) {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[str2.length][str1.length];
}
