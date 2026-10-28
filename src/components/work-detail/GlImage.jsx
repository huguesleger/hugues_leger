import { forwardRef } from "react";

/**
 * Le <img> donne la mise en page, l'accessibilité et le fallback sans WebGL ;
 * il est masqué (classe `is-gl`) dès que le plan correspondant est prêt.
 */
const GlImage = forwardRef(function GlImage(
  { src, alt = "", className = "", ...rest },
  ref,
) {
  return (
    <figure
      ref={ref}
      className={["gl-image", className].filter(Boolean).join(" ")}
      data-gl-src={src}
      {...rest}
    >
      {/* Simple repère de mise en page, masqué dès que le canvas WebGL prend le relais. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" draggable={false} />
    </figure>
  );
});

export default GlImage;
