export default function Footer({ className = "" }) {
  const rootClass = ["site-footer", className].filter(Boolean).join(" ");

  return (
    <footer className={rootClass}>
      <p className="site-footer__copy">&copy; HL 2026. Tous droits réservés</p>
    </footer>
  );
}
