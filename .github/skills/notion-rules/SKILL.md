# Notion Integration Rules & Workflow

This skill defines how to interact with the project's Notion workspace (Database: "Planntrip") for tracking improvements and managing development tasks.

## Method Priority (IMPORTANT)

**ALWAYS try MCP tools first** for ALL Notion operations (read AND write). Only fall back to the Direct Notion API (`Invoke-RestMethod` in PowerShell) if the MCP tool fails or returns a validation error.

### MCP Capabilities (Verified)
| Operation | MCP Tool | Works? |
|-----------|----------|--------|
| Search pages | `mcp_notionapi_API-post-search` | ✅ |
| Read page | `mcp_notionapi_API-retrieve-a-page` | ✅ |
| Query database | `mcp_notionapi_API-query-data-source` | ✅ |
| Update page properties | `mcp_notionapi_API-patch-page` | ✅ |
| Create page | `mcp_notionapi_API-post-page` | ✅ |
| Delete block | `mcp_notionapi_API-delete-a-block` | ✅ |
| Append paragraph blocks | `mcp_notionapi_API-patch-block-children` | ✅ |
| Append heading/divider/list blocks | `mcp_notionapi_API-patch-block-children` | ❌ (schema validation error) |

### When to use Direct API (Fallback)
*   Appending rich block content (headings, dividers, bulleted lists) — MCP only supports `paragraph` blocks.
*   If any MCP write operation fails with a validation error, retry with `Invoke-RestMethod`.

## 1. Reporting Code Diagnostics & Improvements

When the user asks for code diagnostics, audits, refactoring suggestions, or technical debt analysis, follow this workflow:

1.  **Analyze**: Perform the requested analysis.
    *   **CRITICAL**: Always consult the project's specific best practices skills (e.g., `react-best-practices`, `nodejs-best-practices`) to ensure alignment with the team's standards before reporting.
2.  **Report to Notion**: **IMMEDIATELY create a new Notion page** for each distinct improvement or issue found. Do NOT ask the user for permission to create the pages. Proceed directly to execution.
3.  **Method**: **Try MCP first** (`mcp_notionapi_API-post-page`). If it fails, fall back to `Invoke-RestMethod`.
    *   *Note: If using the API fallback and the IDE prompts for terminal command permission, this is expected behavior. The user should approve it.*
4.  **Card Properties**:
    *   **Nombre**: A clear, concise title for the improvement.
    *   **Categoria** (Select): Set to `"Mejoras"`.
    *   **Plataforma** (Select): Set to `"Web"`, `"Nativa"`, or `"Backend"` depending on the context.
    *   **Estado** (Status): Set to `"Sin empezar"`.
    *   **Prioridad** / **Criticidad**: Infer level ("Alta", "Media", "Baja") based on the severity of the issue.
    *   **Page Content**: Include the full technical detail, code snippets, and explanation in the body of the page.

## 2. Developing Tasks from Notion

When the user asks to work on a specific task or feature from Notion:

1.  **Read the Task**:
    *   **Method**: Use **MCP** (`mcp_notionapi_API-query-data-source` or `mcp_notionapi_API-post-search`).
    *   **Action**: Find the card by title or ID and read its description to understand specific requirements.
    *   **Confirmation**: Confirm to the user that you have read and understood the requirements.

2.  **Update Status**:
    *   **Method**: **Try MCP first** (`mcp_notionapi_API-patch-page`). Fall back to API if it fails.
    *   **Action**: Before starting code, update the card:
        *   `Estado`: Change to `"En desarrollo"`.
        *   `Fecha de inicio`: Set to the current date.
    *   **IMPORTANT**: Property `"Fecha de culminación "` has a trailing space in its name. Always include it.

3.  **Implementation & Incremental Documentation** (CRITICAL for context preservation):
    *   Perform the necessary coding tasks in the workspace.
    *   **RULE: Document progress incrementally in the Notion card** to prevent context loss when sessions end or context windows reset.

    ### Incremental Documentation Rules

    **When to document (triggers — at least ONE must apply):**
    1.  **After each completed sub-task or logical step** — e.g., finished a component, fixed a bug, added an endpoint, updated a config file. Even small changes count if they represent a discrete unit of work.
    2.  **After modifying 3+ files** in a single logical change.
    3.  **When the conversation becomes long** — if the conversation has had 15+ back-and-forth exchanges, start documenting after every change regardless of size.
    4.  **Before any risky or complex operation** — document current state so it can be resumed if the session is lost.
    5.  **When switching between sub-tasks** within the same card — document what was completed before moving on.

    **What to document in each incremental update:**
    *   📌 **What was done**: Brief description of the change (1-3 sentences).
    *   📁 **Files modified/created**: List the specific file paths.
    *   ✅ **Current state**: What is working / what was completed.
    *   ⏳ **What remains**: Pending steps or next actions (if any).
    *   ⚠️ **Important context**: Any decisions made, edge cases found, or things the next session must know.

    **Format for incremental updates:**
    ```
    --- Progreso [YYYY-MM-DD HH:MM] ---
    ✅ Completado: [descripción breve]
    📁 Archivos: [lista de archivos]
    ⏳ Pendiente: [qué falta]
    ⚠️ Notas: [contexto importante]
    ```

    **Method**: Use MCP (`mcp_notionapi_API-patch-block-children`) to append `paragraph` blocks. Each update is appended as a new block — never overwrite previous updates.

    **IMPORTANT**: This incremental documentation does NOT replace the final documentation in step 6. It is an ongoing log during development so that if the context window is lost, a new session can read the Notion card and continue exactly where the previous session left off.

4.  **Completion**:
    *   **WAIT FOR USER CONFIRMATION**: Do NOT move the card to `"Hecho"` automatically. Only mark as done when the user explicitly confirms the task is correct and complete.
    *   **Method**: **Try MCP first** (`mcp_notionapi_API-patch-page`). Fall back to API if it fails.
    *   **Action Upon Confirmation**:
        *   `Estado`: Change to `"Hecho"`.
        *   `Fecha de culminación ` (note trailing space): Set to the current date.

5.  **Push to GitHub** (MANDATORY before final documentation):
    *   After marking the card as "Hecho", **push all changes to GitHub** using `git add`, `git commit`, and `git push`.
    *   Use a descriptive commit message that references the task name (e.g., `feat: Mejorar la pantalla de billetera`).
    *   Take note of the **commit hash** (short hash from `git log --oneline -1`) or the **PR number** if a pull request is created.

6.  **Final Documentation** (MANDATORY — always after pushing to GitHub):
    *   Append a final summary block to the page children with the complete resolution. This is in addition to any incremental updates already logged.
    *   Include: all files changed/created, technical details, and any important decisions.
    *   **MUST include the GitHub reference**: Add the commit hash or PR number in the documentation so the Notion card can be linked to the specific change in GitHub. Example: `"GitHub: commit a1b2c3d"` or `"GitHub: PR #42"`.
    *   For **simple paragraphs only**: Use MCP (`mcp_notionapi_API-patch-block-children`) with `paragraph` blocks.
    *   For **rich documentation** (headings, dividers, bullet lists): Use the **Direct API** (`Invoke-RestMethod`) since MCP does not support these block types.

## 2.1 Resuming Work from a Previous Session

When starting a new session on a task that was previously in progress:

1.  **Read the Notion card** including all block children (incremental logs) using `mcp_notionapi_API-get-block-children`.
2.  **Identify the last progress update** — find the most recent `--- Progreso [...] ---` block.
3.  **Understand current state**: What was completed, what remains, and any important notes.
4.  **Confirm with the user**: Briefly summarize what was done previously and what remains, then proceed.
5.  **Continue documenting incrementally** following the same rules as step 3 above.

## 3. Categories Definition

Use the correct category for each card:
*   **Feature**: New functionalities or modifications to existing functionalities.
*   **Bug**: Errors found in the application (visual or functional).
*   **Mejoras**: Optimizations, technical debt, or code improvements that do not directly change user-facing functionality.

## 4. Technical Reference

### Database IDs
*   **Database ID**: `104a5885-3cc3-83da-a177-81c83f17669d` (Planntrip)
*   **Data Source ID** (for MCP): `feca5885-3cc3-8349-9f66-077ea12f6ee9`

### MCP Examples

#### Update page properties (status + date)
```
mcp_notionapi_API-patch-page({
  page_id: "PAGE_ID_HERE",
  properties: {
    "Estado": { "status": { "name": "Hecho" } },
    "Fecha de culminación ": { "date": { "start": "2026-02-07" } }
  }
})
```

#### Append paragraph blocks via MCP
```
mcp_notionapi_API-patch-block-children({
  block_id: "PAGE_ID_HERE",
  children: [
    { "paragraph": { "rich_text": [{ "text": { "content": "Your text here" } }] } }
  ]
})
```

### Direct API Fallback (PowerShell)
Use this when MCP fails or when appending rich block types (headings, dividers, bullet lists):

```powershell
$headers = @{
  "Authorization" = "Bearer ntn_YOUR_KEY_HERE"
  "Notion-Version" = "2022-06-28"
}
$body = @{
  parent = @{ database_id = "104a5885-3cc3-83da-a177-81c83f17669d" }
  properties = @{
    Nombre = @{ title = @(@{ text = @{ content = "Title Here" } }) }
    Estado = @{ status = @{ name = "Sin empezar" } }
    Plataforma = @{ select = @{ name = "Web" } }
    Categoria = @{ select = @{ name = "Mejoras" } }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://api.notion.com/v1/pages" -Method Post -Headers $headers -ContentType "application/json" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```
