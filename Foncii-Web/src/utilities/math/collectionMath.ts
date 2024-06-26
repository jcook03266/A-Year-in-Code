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
