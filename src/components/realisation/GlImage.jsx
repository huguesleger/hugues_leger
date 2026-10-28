import { forwardRef } from "react";

/**
 * Emplacement d'une image rendue dans le canvas WebGL de la page détail.
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
      <img src={src} alt={alt} loading="lazy" draggable={false} />
    </figure>
  );
});

export default GlImage;
