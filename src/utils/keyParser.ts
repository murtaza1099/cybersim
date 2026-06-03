export function parseKeyRole(key: string): 'super_admin' | 'org_admin' | 'employee' | null {
  if (key.startsWith('SA-')) return 'super_admin';
  if (key.startsWith('ORG-')) return 'org_admin';
  if (key.startsWith('EMP-')) return 'employee';
  return null;
}

export function maskKey(key: string): string {
  if (key.length <= 4) return key;
  const prefix = key.slice(0, key.indexOf('-') + 1);
  return `${prefix}${'•'.repeat(Math.min(key.length - prefix.length, 12))}`;
}
