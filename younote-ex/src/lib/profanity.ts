/*
only English for now.
Build the profanity and offensive language matcher using the recommended English dataset and transformers
*/

import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});


export function containsHatefulLanguage(text: string): boolean
{
  const hasBadWords = matcher.hasMatch(text);

  if (hasBadWords === true)
  {
    return true;
  }

  return false;
}