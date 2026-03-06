import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Characters from "./pages/Characters";
import CharacterSheet from "./pages/CharacterSheet";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
