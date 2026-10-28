import React from "react";
import { Circle, icons } from "lucide-react";

function resolveIcon(icon) {
  if (!icon) return Circle;
  if (typeof icon === "function" || (typeof icon === "object" && (icon.$$typeof || icon.render))) {
    return icon;
  }
  if (typeof icon === "string") {
    const formatted = icon
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
    return icons[formatted] || icons[icon] || Circle;
  }
  return Circle;
}

export default function CompetenceTitle({ title, icon = "Circle", bold = false }) {
  const IconComponent = resolveIcon(icon);

  return (
    <span className={`wrap-keyword${bold ? " keyword-bold" : ""}`}>
      {title}
      <span className="separate-keyword">
        <IconComponent className="keyword-icon" aria-hidden="true" />
      </span>
    </span>
  );
}
