import { useState } from "react";
import Threats from "../pages/Threats";
import Locations from "../pages/Locations";
import GMSimplePanel from "./GMSimplePanel";

type GMMode = "simple" | "advanced";
type GMTab = "threats" | "locations";

export default function GMPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<GMMode>("simple");
  const [activeTab, setActiveTab] = useState<GMTab>("threats");

  return (
    <div
      className={`gm-panel ${open ? "gm-panel--open" : ""}`}
      onClick={!open ? () => setOpen(true) : undefined}
    >
      {/* Vertical label shown when collapsed */}
      {!open && (
        <span className="gm-panel__vertical-label">GAME MASTER</span>
      )}

      {/* Panel body */}
      <div className="gm-panel__body">
        <div className="gm-panel__header">
          <span className="gm-panel__title">Game Master</span>
          <button
            className="gm-panel__close"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          >✕</button>
        </div>

        {/* Mode navbar — Simple / Advanced */}
        <nav className="gm-panel__mode-nav">
          {(["simple", "advanced"] as GMMode[]).map((m) => (
            <button
              key={m}
              className={`gm-panel__mode-btn ${mode === m ? "gm-panel__mode-btn--active" : ""}`}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </nav>

        {mode === "simple" && (
          <GMSimplePanel />
        )}

        {mode === "advanced" && (
          <>
            {/* Threats / Locations tabs */}
            <nav className="gm-panel__tabs">
              {(["threats", "locations"] as GMTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`gm-panel__tab ${activeTab === tab ? "gm-panel__tab--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
            <div className="gm-panel__content">
              {activeTab === "threats" && <Threats />}
              {activeTab === "locations" && <Locations />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
