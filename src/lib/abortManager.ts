// Abort manager for canceling in-flight requests
const activeControllers = new Map<string, AbortController>();

export function createAbortable(key: string): AbortSignal {
  // Abort any existing request with this key
  const existingController = activeControllers.get(key);
  if (existingController) {
    console.log(`Aborting existing request: ${key}`);
    existingController.abort();
  }
  
  // Create new controller
  const controller = new AbortController();
  activeControllers.set(key, controller);
  
  return controller.signal;
}

export function cleanupAbortable(key: string): void {
  activeControllers.delete(key);
}

export function abortAll(): void {
  console.log(`Aborting ${activeControllers.size} active requests`);
  activeControllers.forEach(controller => controller.abort());
  activeControllers.clear();
}
