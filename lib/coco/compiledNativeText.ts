// Native sidebar fields remain usable when the compiled design has no equivalent.
const GROUPS: Record<string, string[]> = {
  headline: ['headline'], headline2: ['headline2', 'head2'],
  presenter: ['presenter', 'presents'], details: ['details'],
  details2: ['details2', 'djLineup'],
  date: ['date', 'day', 'month', 'weekday'],
  time: ['time', 'meridiem', 'timeConnector', 'endTime'],
  venue: ['venue', 'address'], subtag: ['subtag'],
  leftRail: ['leftRail', 'rsvp', 'rsvpLabel'],
  rightRail: ['rightRail', 'footerDetails'], socialHandle: ['socialHandle'],
  compliance: ['compliance'],
};

export function missingCompiledNativeTextNodes(objects: readonly any[]) {
  const owned = new Set<string>();
  for (const object of objects) {
    if (object?.kind !== 'text') continue;
    for (const key of [object.semanticRole, object.binding?.semanticRole, object.binding?.panel, object.binding?.moveTarget]) {
      if (typeof key === 'string') owned.add(key);
    }
  }
  return Object.entries(GROUPS).filter(([, roles]) => !roles.some(role => owned.has(role))).map(([node]) => node);
}
