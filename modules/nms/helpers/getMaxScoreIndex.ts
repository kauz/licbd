/**
 * Get the max scores with corresponding indicies
 * Adapted from the OpenCV c++ source in `nms.inl.hpp <https://github.com/opencv/opencv/blob/ee1e1ce377aa61ddea47a6c2114f99951153bb4f/modules/dnn/src/nms.inl.hpp#L33>`
 *
 * @param scores: a list of scores
 * @param threshold: consider scores higher than this threshold
 * @param topK: return at most topK scores; if 0, keep all
 * @param descending: if true, list is returned in descending order, else ascending
 */
// @ts-ignore
export function getMaxScoreIndex(scores, threshold = 0, topK = 0, descending = true) {
  const scoreIndex = [];

  // Generate index score pairs
  for (let i = 0; i < scores.length; i++ ){
    const score = scores[i];
    if (threshold > 0 && score > threshold) {
      scoreIndex.push([score, i]);
    }

  }


  // descending ? descending order : ascending order
  const sorted = scoreIndex.sort((a, b) => descending ? b[0] - a[0]: a[0] - b[0]);

  if (topK > 0) {
    return sorted.slice(0, topK)
  }

  return sorted;
}

