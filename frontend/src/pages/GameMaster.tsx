import React from "react";
import GameMasterNavbar from "../components/GameMasterNavbar";
import { Outlet } from "react-router-dom";

export default function GameMaster() {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <h1>Game Master Content</h1>
      <GameMasterNavbar />
      <div style={{ marginTop: 24, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
