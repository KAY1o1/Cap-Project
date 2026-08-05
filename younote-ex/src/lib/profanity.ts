// FILTER: hateful speech — blocks racist/hateful language in notes before they're saved.
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsHatefulLanguage(text: string): boolean {
  return matcher.hasMatch(text);
}
<<<<<<< HEAD
// END FILTER
=======
// END FILTER
>>>>>>> 80045aceb4b7812142d8616bd311a01dc4e92cf6
