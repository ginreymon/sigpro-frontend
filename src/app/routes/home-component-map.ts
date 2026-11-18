import { ComponentLoader } from './component-map';

// Keys must match core.HomeView.key rows (assigned per role via core.RoleHomeView).
// Add a new entry here when a new role needs its own home view.
// Only the home view of the logged-in role is downloaded.
export const homeDefaultLoader: ComponentLoader = () =>
  import('../pages/home/views/home-default/home-default').then((m) => m.HomeDefault);

export const homeComponentMap: Record<string, ComponentLoader> = {
  'HomeThreadTrimmer': () => import('../pages/home/views/home-thread-trimmer/home-thread-trimmer').then((m) => m.HomeThreadTrimmer),
  'HomeProductionCoordinator': () => import('../pages/home/views/home-production-coordinator/home-production-coordinator').then((m) => m.HomeProductionCoordinator),
  'HomeStampingCoordinator': () => import('../pages/home/views/home-stamping-coordinator/home-stamping-coordinator').then((m) => m.HomeStampingCoordinator),
  'HomeEngineer': () => import('../pages/home/views/home-engineer/home-engineer').then((m) => m.HomeEngineer),
  'HomeScreenPrinter': () => import('../pages/home/views/home-screen-printer/home-screen-printer').then((m) => m.HomeScreenPrinter),
};
