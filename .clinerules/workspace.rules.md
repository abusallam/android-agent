# 🧠 Workspace Rules for Cline (Project-Specific)

These rules apply only to the **current project**.

---

## 🚀 Project Context

- Stack: **Python (UV)** + **Next.js** + **MCP** + **Playwright**.
- Always validate environment:
  - `uv venv` or `.venv`
  - `package.json` for Next.js
  - `mcp.config.yaml` if exists
  - `playwright.config.ts`

---

## 🐍 Python Rules

- Use `uv sync` to install dependencies from lockfiles.
- For new libs: `uv add <package>`.
- Always document functions with docstrings.
- Keep tests in `tests/` directory, mirror structure of `src/`.

---

## ⚡ Next.js Rules

- Always validate `next.config.js` after changes.
- Use `pages/` or `app/` convention consistently – don’t mix.
- Prefer `server` actions over `client` unless UI requires it.
- Ensure Tailwind is applied consistently.

---

## 🧪 Testing Rules

- Python: run `pytest -q`.
- Frontend: run `playwright test`.
- Always regenerate snapshots if UI changes.
- Never merge failing tests into `main`.

---

## 🔐 MCP Integration

- Treat MCP as **controller** of agentic flow.
- Always check for `mcp.context.*` before coding.
- Never reset or clear MCP state unless instructed.
