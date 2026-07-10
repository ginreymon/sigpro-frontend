export function scopeByModuleUrl<
  T extends { location?: { core_module?: { url?: string | null } | null } | null },
>(items: T[], url?: string | null): T[] {
  return items.filter((item) => item.location?.core_module?.url === url);
}
