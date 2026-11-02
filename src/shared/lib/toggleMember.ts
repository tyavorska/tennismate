export function toggleMember<T>(members: ReadonlySet<T>, member: T): ReadonlySet<T> {
  const next = new Set(members);
  if (next.has(member)) next.delete(member);
  else next.add(member);
  return next;
}
