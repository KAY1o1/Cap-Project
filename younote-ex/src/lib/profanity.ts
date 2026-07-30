// FILTER: hateful speech — blocks racist/hateful language in notes before they're saved.
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsHatefulLanguage(text: string): boolean {
  return matcher.hasMatch(text);
}
// END FILTER