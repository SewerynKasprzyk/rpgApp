import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Character", path: "/characters" },
  { label: "Game Master", path: "/gamemaster" },
  { label: "Session", path: "/session" },
];

export default function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`sidebar ${open ? "sidebar--open" : ""}`}
      onClick={!open ? () => setOpen(true) : undefined}
      aria-label={open ? "Menu open" : "Open menu"}
    >
      {!open && <span className="sidebar__vertical-label">MENU</span>}
      {open && (
        <button
          className="sidebar__close"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          aria-label="Close menu"
        >
          ✕
        </button>
      )}
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={(e) => e.stopPropagation()}
            className={`sidebar__link ${
              location.pathname.startsWith(item.path)
                ? "sidebar__link--active"
                : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
