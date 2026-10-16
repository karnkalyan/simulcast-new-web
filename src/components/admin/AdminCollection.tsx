"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  X,
  Save,
  ArrowUpRight,
  Upload,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Layers,
} from "lucide-react";

export type Entity = "services" | "projects" | "posts" | "inquiries" | "users";
type Row = Record<string, unknown>;
type Field = {
  key: string;
  label: string;
  kind?: "textarea" | "checkbox" | "number" | "select" | "password" | "image";
  options?: string[];
  placeholder?: string;
};

interface MediaAsset {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  alt: string;
}

const common: Field[] = [
  { key: "slug", label: "URL slug", placeholder: "your-item-slug" },
  { key: "title", label: "Title" },
];

const fields: Record<Entity, Field[]> = {
  services: [
    ...common,
    { key: "eyebrow", label: "Section kicker" },
    { key: "summary", label: "Short description", kind: "textarea" },
    { key: "body", label: "Full content", kind: "textarea" },
    { key: "icon", label: "Icon name" },
    { key: "imageUrl", label: "Cover image", kind: "image" },
    { key: "sortOrder", label: "Order", kind: "number" },
    { key: "published", label: "Visible on website", kind: "checkbox" },
  ],
  projects: [
    ...common,
    { key: "category", label: "Category" },
    { key: "location", label: "Location or 'Concept showcase'" },
    { key: "summary", label: "Summary", kind: "textarea" },
    { key: "body", label: "Overview", kind: "textarea" },
    { key: "imageUrl", label: "Cover image", kind: "image" },
    { key: "featured", label: "Featured", kind: "checkbox" },
    { key: "published", label: "Published", kind: "checkbox" },
    { key: "sortOrder", label: "Order", kind: "number" },
  ],
  posts: [
    ...common,
    { key: "category", label: "Category" },
    { key: "excerpt", label: "Excerpt (Summary)", kind: "textarea" },
    { key: "body", label: "Article body (plain text / markdown)", kind: "textarea" },
    { key: "imageUrl", label: "Cover image (upload file or enter URL)", kind: "image" },
    { key: "published", label: "Publish this insight", kind: "checkbox" },
  ],
  inquiries: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "organization", label: "Organization" },
    { key: "interest", label: "Interest" },
    { key: "message", label: "Message", kind: "textarea" },
    { key: "status", label: "Status", kind: "select", options: ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"] },
    { key: "internalNotes", label: "Internal notes", kind: "textarea" },
  ],
  users: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "password", label: "Password (14+ characters)", kind: "password" },
    { key: "role", label: "Role", kind: "select", options: ["ADMIN", "EDITOR"] },
    { key: "active", label: "Active", kind: "checkbox" },
  ],
};

const titles: Record<Entity, string> = {
  services: "Services & solutions",
  projects: "Project showcases",
  posts: "Insights & articles",
  inquiries: "Contact enquiries",
  users: "Administrators",
};

export default function AdminCollection({ entity }: { entity: Entity }) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  // Media Library state for image picker
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${entity}`, { cache: "no-store" });
      const val = await res.json();
      if (!res.ok) throw Error(val.error);
      setItems(val);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadMediaAssets() {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(data || []);
      }
    } catch {}
  }

  useEffect(() => {
    void reload();
    void loadMediaAssets();
  }, [entity]);

  const editable = (e: Field) => !(entity === "inquiries" && !["status", "internalNotes"].includes(e.key));

  function edit(item: Row) {
    setActive(item);
    setCreating(false);
    setError("");
    setCurrentImageUrl(String(item.imageUrl || ""));
    setShowMediaBrowser(false);
  }

  function create() {
    setActive({ published: true, active: true, sortOrder: 0, status: "NEW", role: "EDITOR", imageUrl: "" });
    setCreating(true);
    setError("");
    setCurrentImageUrl("");
    setShowMediaBrowser(false);
  }

  async function handleDirectImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name);

      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");

      setCurrentImageUrl(data.path);
      await loadMediaAssets();
      setNotice(`Uploaded ${file.name} successfully.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active) return;
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload: Row = {};

    for (const f of fields[entity]) {
      if (entity === "inquiries" && !editable(f)) continue;

      if (f.key === "imageUrl") {
        payload.imageUrl = currentImageUrl.trim();
        continue;
      }

      payload[f.key] =
        f.kind === "checkbox"
          ? form.get(f.key) === "on"
          : f.kind === "number"
          ? Number(form.get(f.key) || 0)
          : String(form.get(f.key) || "");
    }

    const id = String(active.id || "");
    try {
      const res = await fetch(creating ? `/api/admin/${entity}` : `/api/admin/${entity}/${id}`, {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Could not save");
      setActive(null);
      setNotice("Changes saved successfully.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Row) {
    if (!confirm(`Permanently delete ${String(item.title || item.name || item.email)}?`)) return;
    setError("");
    const res = await fetch(`/api/admin/${entity}/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setNotice("Item deleted.");
      await reload();
    } else {
      const d = await res.json();
      setError(d.error || "Delete failed");
    }
  }

  const view = items.filter((i) =>
    (String(i.title || i.name || "") + String(i.category || i.interest || "") + String(i.email || ""))
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="admin-heading">
        <div>
          <div className="eyebrow">CONTENT STUDIO / {entity.toUpperCase()}</div>
          <h1>
            {titles[entity]}
            <span className="admin-pink">.</span>
          </h1>
          <p>
            {entity === "inquiries"
              ? "Review enquiries and record follow-up progress."
              : "Create, edit, attach images, and publish website content."}
          </p>
        </div>
        {entity !== "inquiries" && (
          <button onClick={create} className="btn btn-pink">
            <Plus size={17} /> Add new
          </button>
        )}
      </div>

      {notice && <div className="notice-note">{notice}</div>}
      {error && !active && <div className="error-note">{error}</div>}

      <div className="admin-table-shell">
        <div className="admin-table-toolbar">
          <div className="admin-search">
            <Search size={17} />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search records..." />
          </div>
          <span>{items.length} total records</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{entity === "users" || entity === "inquiries" ? "Name" : "Title & Cover"}</th>
                <th>{entity === "inquiries" ? "Topic" : entity === "users" ? "Access" : "Category / Slug"}</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {view.map((i) => (
                <tr key={String(i.id)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {Boolean(i.imageUrl) && (
                        <img
                          src={String(i.imageUrl)}
                          alt=""
                          style={{
                            width: 44,
                            height: 34,
                            borderRadius: 4,
                            objectFit: "cover",
                            border: "1px solid #e1d6e6",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div>
                        <strong>{String(i.title || i.name || "")}</strong>
                        <small style={{ display: "block", color: "#6d6975" }}>
                          {entity === "inquiries"
                            ? String(i.email || "")
                            : entity === "users"
                            ? String(i.email || "")
                            : String(i.summary || i.excerpt || "").slice(0, 85)}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{String(i.category || i.interest || i.slug || i.role || "—")}</td>
                  <td>
                    <span className={`table-status ${i.published === false || i.active === false ? "inactive" : ""}`}>
                      {entity === "inquiries"
                        ? String(i.status)
                        : entity === "users"
                        ? i.active
                          ? "Active"
                          : "Disabled"
                        : i.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => edit(i)} title="Edit">
                        <Pencil size={17} />
                      </button>
                      {entity !== "inquiries" && (
                        <button onClick={() => remove(i)} title="Delete">
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && view.length === 0 && (
            <div className="admin-empty">
              No records found. {entity !== "inquiries" ? "Use Add new to create one." : "New contact submissions appear here."}
            </div>
          )}
          {loading && <div className="admin-empty">Loading records...</div>}
        </div>
      </div>

      {/* Edit / Create Modal */}
      {active && (
        <div className="cms-modal-wrap" role="dialog" aria-modal="true" aria-label="Edit record">
          <div className="cms-modal-scrim" onClick={() => setActive(null)} />
          <div className="cms-modal" style={{ maxWidth: 720 }}>
            <div className="cms-modal-header">
              <div>
                <div className="eyebrow">{creating ? "NEW RECORD" : "EDIT RECORD"}</div>
                <h2>{String(active.title || active.name || "Create content")}</h2>
              </div>
              <button aria-label="Close" onClick={() => setActive(null)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={save}>
              <div className="cms-fields">
                {fields[entity].map((f) => {
                  // Interactive Image Upload & URL Manager for cover images
                  if (f.kind === "image" || f.key === "imageUrl") {
                    return (
                      <div
                        key={f.key}
                        style={{
                          background: "#faf8fb",
                          padding: "16px 18px",
                          borderRadius: 8,
                          border: "1px solid #e8e2ec",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: "#2b0d3a", margin: 0 }}>
                            {f.label}
                          </label>
                          {currentImageUrl && (
                            <button
                              type="button"
                              onClick={() => setCurrentImageUrl("")}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#b91c1c",
                                fontSize: 11,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <X size={12} /> Clear image
                            </button>
                          )}
                        </div>

                        {/* Image Preview Thumbnail */}
                        {currentImageUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div
                              style={{
                                width: 140,
                                height: 85,
                                borderRadius: 6,
                                overflow: "hidden",
                                border: "2px solid #e11d72",
                                background: "#2b0d3a",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={currentImageUrl}
                                alt="Cover preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <div style={{ fontSize: 12, color: "#6d6975", overflow: "hidden" }}>
                              <strong style={{ color: "#2b0d3a", display: "block" }}>Active Image URL:</strong>
                              <span style={{ wordBreak: "break-all", fontFamily: "monospace" }}>{currentImageUrl}</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "16px",
                              border: "2px dashed #d5ccd8",
                              borderRadius: 6,
                              textAlign: "center",
                              color: "#8a8292",
                              fontSize: 13,
                              background: "#ffffff",
                            }}
                          >
                            No image selected yet. Upload an image file below or enter an image URL.
                          </div>
                        )}

                        {/* Upload & Browse Buttons */}
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleDirectImageUpload}
                            accept="image/png,image/jpeg,image/webp,image/avif"
                            style={{ display: "none" }}
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="btn btn-pink"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "7px 14px" }}
                          >
                            <Upload size={14} />
                            {uploadingImage ? "Uploading..." : "Upload New Image File"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowMediaBrowser(!showMediaBrowser)}
                            className="btn btn-outline"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "7px 14px" }}
                          >
                            <ImageIcon size={14} />
                            {showMediaBrowser ? "Hide Media Library" : "Choose from Media Library"}
                          </button>

                          <a
                            href="/admin/media"
                            target="_blank"
                            style={{ fontSize: 11, color: "#6d6975", display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto" }}
                          >
                            Open Media Studio <ExternalLink size={12} />
                          </a>
                        </div>

                        {/* Direct URL input */}
                        <div>
                          <label style={{ fontSize: 11, color: "#6d6975", display: "block", marginBottom: 4 }}>
                            Or paste image URL directly:
                          </label>
                          <input
                            type="text"
                            value={currentImageUrl}
                            onChange={(e) => setCurrentImageUrl(e.target.value)}
                            placeholder="e.g. /visuals/futuristic_neon_analytics_control_centre.webp or https://..."
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: 6,
                              border: "1px solid #d5ccd8",
                              fontSize: 13,
                              background: "#ffffff",
                            }}
                          />
                        </div>

                        {/* Inline Media Library Browser Picker */}
                        {showMediaBrowser && (
                          <div
                            style={{
                              marginTop: 10,
                              background: "#ffffff",
                              border: "1px solid #e1d6e6",
                              borderRadius: 6,
                              padding: 12,
                              maxHeight: 220,
                              overflowY: "auto",
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#2b0d3a", marginBottom: 8 }}>
                              Click any asset below to set it as cover image:
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                              {mediaAssets.map((asset) => (
                                <div
                                  key={asset.id}
                                  onClick={() => {
                                    setCurrentImageUrl(asset.path);
                                    setShowMediaBrowser(false);
                                  }}
                                  style={{
                                    border: currentImageUrl === asset.path ? "2px solid #e11d72" : "1px solid #e8e2ec",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    background: "#f9f8fa",
                                    position: "relative",
                                  }}
                                  title={asset.filename}
                                >
                                  <img
                                    src={asset.path}
                                    alt={asset.alt || asset.filename}
                                    style={{ width: "100%", height: 55, objectFit: "cover" }}
                                  />
                                  <span style={{ fontSize: 9, display: "block", padding: "2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {asset.filename}
                                  </span>
                                </div>
                              ))}
                              {mediaAssets.length === 0 && (
                                <p style={{ fontSize: 12, color: "#8a8292", gridColumn: "1 / -1" }}>
                                  No media uploaded yet. Use "Upload New Image File" above.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <label key={f.key}>
                      {f.label}
                      {f.kind === "textarea" ? (
                        <textarea
                          rows={f.key === "body" ? 8 : 4}
                          name={f.key}
                          defaultValue={String(active[f.key] ?? "")}
                          disabled={!editable(f)}
                        />
                      ) : f.kind === "checkbox" ? (
                        <input
                          type="checkbox"
                          name={f.key}
                          defaultChecked={Boolean(active[f.key])}
                          disabled={!editable(f)}
                        />
                      ) : f.kind === "select" ? (
                        <select
                          name={f.key}
                          defaultValue={String(active[f.key] || f.options?.[0] || "")}
                          disabled={!editable(f)}
                        >
                          {f.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={f.key}
                          type={f.kind === "number" ? "number" : f.kind === "password" ? "password" : "text"}
                          defaultValue={f.kind === "password" ? "" : String(active[f.key] ?? "")}
                          placeholder={f.placeholder || ""}
                          disabled={!editable(f)}
                          required={f.key === "password" || ["slug", "title"].includes(f.key)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              {error && <div className="error-note">{error}</div>}

              <div className="cms-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setActive(null)}>
                  Cancel
                </button>
                <button disabled={saving} type="submit" className="btn btn-pink">
                  <Save size={17} />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
