type SystemStatusListener = (down: boolean) => void;

const listeners = new Set<SystemStatusListener>();

let systemDown = false;

export function getSystemDown(): boolean {
  return systemDown;
}

export function setSystemDown(down: boolean): void {
  if (systemDown === down) {
    return;
  }

  systemDown = down;

  for (const listener of listeners) {
    listener(systemDown);
  }
}

export function subscribeSystemStatus(listener: SystemStatusListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
