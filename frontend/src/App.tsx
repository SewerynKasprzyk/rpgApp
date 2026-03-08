import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Characters from "./pages/Characters";
import CharacterSheet from "./pages/CharacterSheet";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import GameMaster from "./pages/GameMaster";
import Threats from "./pages/Threats";
import Locations from "./pages/Locations";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterSheet />} />
          <Route path="/session" element={<Sessions />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/gamemaster" element={<GameMaster />}>
            <Route path="threats" element={<Threats />} />
            <Route path="locations" element={<Locations />} />
          </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
