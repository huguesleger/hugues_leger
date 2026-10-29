import { cursorStore } from "./cursorStore";

const DEFAULT_CANVAS_LABEL = "View";

export function isCursorCanvasHover() {
  return cursorStore.getState().isHover;
}

export function setCursorCanvasHover(active, label = DEFAULT_CANVAS_LABEL) {
  if (active) {
    cursorStore.set({
      label,
      big: false,
      dark: false,
      drag: false,
      isHover: true,
    });
  } else {
    cursorStore.reset();
  }
}
