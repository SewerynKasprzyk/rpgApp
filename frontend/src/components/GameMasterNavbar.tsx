import React from "react";
import { Link, useLocation } from "react-router-dom";

const gmMenuItems = [
  { label: "Threats", path: "/gamemaster/threats" },
  { label: "Locations", path: "/gamemaster/locations" },
];

export default function GameMasterNavbar() {
  const location = useLocation();
  return (
    <nav className="gm-navbar">
      {gmMenuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`gm-navbar__link ${
            location.pathname === item.path ? "gm-navbar__link--active" : ""
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
