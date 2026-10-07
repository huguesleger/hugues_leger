const DEFAULT_CANVAS_LABEL = "View";

let canvasHoverActive = false;

export function isCursorCanvasHover() {
  return canvasHoverActive;
}

export function setCursorCanvasHover(active, label = DEFAULT_CANVAS_LABEL) {
  canvasHoverActive = active;

  const cursor = document.querySelector(".cursor");
  const wrapper = document.querySelector(".cursor-wrapper");
  const labelEl = document.querySelector(".cursor-label");
  if (!cursor) return;

  if (active) {
    if (labelEl) labelEl.textContent = label;
    cursor.classList.remove("has-big", "has-dark");
    cursor.classList.add("has-label");
    wrapper?.classList.add("is-hover");
  } else {
    cursor.classList.remove("has-label");
    wrapper?.classList.remove("is-hover");
    if (labelEl) labelEl.textContent = "";
  }
}
