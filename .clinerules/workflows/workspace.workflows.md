# 🧠 Workspace Workflows for Cline (AI Agent Coding via VS Code)

These workflows apply **per project** and ensure stable agentic development with **Python (UV)**, **Next.js**, **MCP Contexts**, and **Playwright**.

---

## 🔁 Workspace AI Workflows

### 1. 📦 Setup & Initialization

**Trigger:** `cline setup` or first project load.

yaml

- Validate Python environment (`uv venv`, `.venv`, or `pyproject.toml`).
- Ensure `uv.lock` exists; run `uv sync` if missing.
- Validate `package.json` and `next.config.js` for Next.js.
- Ensure MCP context files exist in `/mcp/context/` or `.context/`.
- Detect Playwright config (`playwright.config.ts`).

**Agent Prompt:**  
Initialize the workspace using MCP context. Respect UV and Next.js structures.  
Do not assume — ask if unclear. Confirm project goal, then propose context-specific setup.

---

### 2. 🚀 Dev Container Management

**Trigger:** Dev Container is opened.

yaml

- Check for port conflicts (3000, 5000, 8000).
- Load `.env` securely and map variables.
- Start MCP proxy if `mcp.config.yaml` is present.
- Watch for idle > 5 minutes → exit container gracefully.

**Agent Prompt:**  
You are operating inside a Dev Container.  
Prioritize port hygiene, MCP agent activation, and environment stability.  
Exit cleanly after file updates or inactivity.

---

### 3. 🧪 Test & Debug Cycle

**Trigger:** After agent-generated code or `cline debug`.

yaml

- Run `pytest -q` for Python.
- Run `playwright test` for frontend/E2E.
- Detect MCP stack trace or context mismatch automatically.
- If repetitive errors: pause, enter debug mode, and confirm before retrying.

**Agent Prompt:**  
Always test generated code.  
If errors occur, don’t retry blindly — pause and ask for clarification.  
Use MCP context to resolve errors before new code attempts.

---

### 4. 🧠 MCP Agentic Enhancement

**Trigger:** MCP context usage (files, memory, objects).

yaml

- Always prioritize MCP instructions over local assumptions.
- Use MCP memory to track file-level changes.
- Never clear or overwrite MCP state without user approval.

**Agent Prompt:**  
Respect MCP as the controller of the agentic system.  
Do not modify or ignore MCP behavior unless explicitly instructed.

---

### 5. 🔐 Pre-Commit & Cleanup

**Trigger:** Before container close or `git push`.

yaml

- Format Python with `uv format` (fallback: `black`).
- Format JS/TS with `prettier --write .`.
- Run `eslint --fix` for Next.js linting.
- Run all tests: `pytest`, `playwright test`.
- Regenerate `.cline/context.json`.
- Run `cline review` to summarize changes.

**Agent Prompt:**  
Run a full lint + test pass before pushing code.  
Generate a clean context snapshot.  
Notify user of unstable modules or failing tests.

---
