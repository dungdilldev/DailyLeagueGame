/** A name as a plain file name: lower case, no accents, words joined by hyphens ("Gen.G" -> "gen-g"). */
export function imageSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}
