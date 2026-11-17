type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribes to "the parking data changed outside a screen" events. Returns the unsubscribe. */
export function onParkingChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitParkingChanged(): void {
  listeners.forEach((listener) => listener());
}
