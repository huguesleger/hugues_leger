export function setCursorCanvasHover(active) {
  const cursor = document.querySelector(".cursor");
  const label = document.querySelector(".cursor-label-canvas");
  if (!cursor) return;

  if (active) {
    cursor.classList.add("has-canvas");
    label?.classList.remove("label-hidden");
  } else {
    cursor.classList.remove("has-canvas");
    label?.classList.add("label-hidden");
  }
}
