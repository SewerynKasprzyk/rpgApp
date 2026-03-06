import { useState } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";

export default function Sessions() {
  const { sessions, loading, error, create, remove } = useSessions();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create({
      name,
      description,
      characters: [],
      enemies: [],
      neutrals: [],
      diceHistory: [],
    });
    setName("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Sessions</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Session"}
        </button>
      </div>

      {showForm && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sess-name">Name</label>
              <input
                id="sess-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="sess-desc">Description</label>
              <input
                id="sess-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <button type="submit">Create Session</button>
        </form>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && sessions.length === 0 && (
        <p>No sessions yet. Create one to get started!</p>
      )}
      {!loading && (
        <div className="character-list">
          {sessions.map((s) => (
            <div key={s.id} className="character-card">
              <h3>
                <Link to={`/session/${s.id}`}>{s.name}</Link>
              </h3>
              {s.description && <p>{s.description}</p>}
              <p>
                <strong>Characters:</strong> {s.characters.length} &nbsp;|&nbsp;
                <strong>Enemies:</strong> {s.enemies.length} &nbsp;|&nbsp;
                <strong>Neutrals:</strong> {s.neutrals.length}
              </p>
              <div className="character-card-actions">
                <Link to={`/session/${s.id}`}>
                  <button>Open</button>
                </Link>
                {deleteId !== s.id && (
                  <button
                    className="btn-danger"
                    onClick={() => {
                      setDeleteId(s.id);
                      setDeleteConfirmText("");
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>

              {deleteId === s.id && (
                <div className="delete-confirm">
                  <p className="delete-confirm__warning">
                    ⚠ This will permanently delete <strong>{s.name}</strong>.
                  </p>
                  <p className="delete-confirm__prompt">
                    Type <strong>{s.name}</strong> to confirm:
                  </p>
                  <input
                    className="delete-confirm__input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={s.name}
                    autoFocus
                  />
                  <div className="delete-confirm__actions">
                    <button
                      className="btn-danger"
                      disabled={deleteConfirmText !== s.name}
                      onClick={() => {
                        remove(s.id);
                        setDeleteId(null);
                        setDeleteConfirmText("");
                      }}
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(null);
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
