/**
 * Store réactif singleton pour l'état du curseur personnalisé.
 *
 * Permet de piloter le curseur de façon déclarative (via CursorTarget ou useCursorTarget)
 * ou programmatique (depuis Three.js/WebGL), sans manipulation manuelle du DOM.
 */

const INITIAL_STATE = Object.freeze({
  isHover: false,
  label: "",
  big: false,
  dark: false,
  drag: false,
});

class CursorStore {
  constructor() {
    this.state = { ...INITIAL_STATE };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  set(partial) {
    if (!partial) return;
    const next = {
      ...this.state,
      ...partial,
      isHover: partial.isHover ?? true,
      label: partial.label ?? (partial.isHover === false ? "" : this.state.label),
    };

    if (
      this.state.isHover === next.isHover &&
      this.state.label === next.label &&
      this.state.big === next.big &&
      this.state.dark === next.dark &&
      this.state.drag === next.drag
    ) {
      return;
    }

    this.state = next;
    this.notify();
  }

  reset() {
    if (
      !this.state.isHover &&
      !this.state.label &&
      !this.state.big &&
      !this.state.dark &&
      !this.state.drag
    ) {
      return;
    }
    this.state = { ...INITIAL_STATE };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const cursorStore = new CursorStore();
