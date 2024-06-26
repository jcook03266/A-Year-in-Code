// Various useful and important functions and mathematical concepts that are used in ML / AI algorithms
// to compute various attributes and values given some input.

// Vector Embeddings for computing distance between embeddings
/**
 * Computes the Euclidean distance between the two embeddings passed as argument
 * Concept: https://www.cuemath.com/euclidean-distance-formula/
 *
 * @param embedding1
 * @param embedding2
 *
 * Note: Make sure the embeddings have the same dimensions or else a runtime error will be thrown
 *
 * @returns -> The distance between the two embeddings
 */
export function computeEuclideanDistance(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length)
    throw new Error("Embedding vector dimensions do not match.");

  let sumOfSquares = 0;
  for (let i = 0; i < embedding1.length; i++) {
    sumOfSquares += Math.pow(embedding1[i] - embedding2[i], 2);
  }

  return Math.sqrt(sumOfSquares);
}

/**
 * Similarity Score between Embeddings, (Euclidean distance / max Euclidean distance)
 * Concept: https://developers.google.com/machine-learning/clustering/similarity/measuring-similarity
 *
 * @param embedding1
 * @param embedding2
 *
 * Note: Make sure the embeddings have the same dimensions or else a runtime error will be thrown
 *
 * @returns -> The similarity score from 0 - 1 (0% to 100%)
 */
export function computeSimilarityScoreBetweenEmbeddings(
  embedding1: number[],
  embedding2: number[]
) {
  // Compute the similarity score from the Euclidean distance between the two taste profiles
  const maxPossibleEuclideanDistance = Math.sqrt(
      Math.max(embedding1.length, embedding2.length)
    ),
    computedEuclideanDistance = computeEuclideanDistance(
      embedding1,
      embedding2
    ),
    similarityScore =
      1 - computedEuclideanDistance / maxPossibleEuclideanDistance;

  return similarityScore;
}
