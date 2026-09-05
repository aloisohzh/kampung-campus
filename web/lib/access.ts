import type { Actor } from './model.ts';
export const rolePages: Record<Actor, string[]> = {
  resident: [
    'dashboard',
    'discover',
    'activities',
    'contributions',
    'wallet',
    'rewards',
    'planner',
  ],
  organizer: ['organizer', 'planner'],
  reviewer: ['reviewer'],
  merchant: ['merchant'],
  operator: ['operator'],
};
export function roleHome(role: Actor) {
  return role === 'resident' ? 'dashboard' : role;
}
export function roleRoute(role: Actor, page: string) {
  return ['welcome', 'account', 'profile', 'help', 'updates'].includes(page) ||
    rolePages[role].includes(page)
    ? page
    : roleHome(role);
}
export function canPlan(role: Actor) {
  return role === 'resident' || role === 'organizer';
}
