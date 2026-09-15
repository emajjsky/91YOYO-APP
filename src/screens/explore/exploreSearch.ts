export interface ExploreSearchItem {
  id: string;
  title: string;
  desc: string;
}

export function filterExploreItems<T extends ExploreSearchItem>(items: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => (
    `${item.title}\n${item.desc}`.toLocaleLowerCase().includes(normalizedQuery)
  ));
}
