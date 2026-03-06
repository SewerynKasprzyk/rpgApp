import { Link } from "react-router-dom";
import React from "react";
import SidebarMenu from "./SidebarMenu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="resize-warning">
        <p>Window too small.<br />Please resize your browser wider to use the app.</p>
      </div>
      <SidebarMenu />
      <div className="app-layout">
        <header className="app-header">
          <nav>
            <Link to="/">Home</Link>
            <Link to="/characters">Characters</Link>
          </nav>
          <h1>DnD Character Manager</h1>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
