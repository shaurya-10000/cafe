export function getTabId(instanceId: string, locationId: string): string {
  return `${instanceId}-location-tab-${locationId}`;
}

export function getPanelId(instanceId: string): string {
  return `${instanceId}-location-panel`;
}

export function getHeadingId(instanceId: string): string {
  return `${instanceId}-locations-heading`;
}
