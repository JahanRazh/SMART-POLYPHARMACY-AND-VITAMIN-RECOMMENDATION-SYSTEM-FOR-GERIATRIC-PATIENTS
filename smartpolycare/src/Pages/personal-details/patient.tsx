"use client";
import React from "react";
import axios from "axios";

type PersonalDetail = {
  id?: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
};

export default function PersonalDetailsPage() {
  const [items, setItems] = React.useState<PersonalDetail[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [form, setForm] = React.useState<PersonalDetail>({ firstName: "", lastName: "", age: 0, email: "" });
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const api = axios.create({ baseURL: "http://127.0.0.1:5000/api" });

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PersonalDetail[]>("/personal-details");
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", age: 0, email: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.patch(`/personal-details/${editingId}`, form);
    } else {
      await api.post("/personal-details", form);
    }
    await fetchAll();
    resetForm();
  };

  const handleEdit = (item: PersonalDetail) => {
    setEditingId(item.id ?? null);
    setForm({
      firstName: item.firstName,
      lastName: item.lastName,
      age: Number(item.age) || 0,
      email: item.email,
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await api.delete(`/personal-details/${id}`);
    await fetchAll();
    if (editingId === id) resetForm();
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Personal Details</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 24 }}>
        <input
          required
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <input
          required
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <input
          required
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm((s) => ({ ...s, age: Number(e.target.value) }))}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: "10px 16px", background: "#111827", color: "#fff", borderRadius: 6, border: 0 }}>
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "10px 16px", background: "#e5e7eb", borderRadius: 6, border: 0 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr", fontWeight: 600, padding: "8px 12px", background: "#f3f4f6", borderRadius: 6 }}>
          <div>First name</div>
          <div>Last name</div>
          <div>Age</div>
          <div>Email</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 12 }}>Loading...</div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr", padding: "8px 12px", border: "1px solid #eee", borderRadius: 6 }}>
              <div>{it.firstName}</div>
              <div>{it.lastName}</div>
              <div>{it.age}</div>
              <div>{it.email}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleEdit(it)} style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", borderRadius: 6, border: 0 }}>Edit</button>
                <button onClick={() => handleDelete(it.id)} style={{ padding: "6px 10px", background: "#dc2626", color: "#fff", borderRadius: 6, border: 0 }}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


