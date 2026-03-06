import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h2>Welcome to the DnD Character Manager</h2>
      <p>
        Manage your characters, track campaigns, and collaborate in real time.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/characters">
          <button>View Characters</button>
        </Link>
      </div>
    </div>
  );
}
