> **PRODUKTENTSCHEIDUNG 08.10.2026:** HufiApp wird NICHT mehr als eigenständiges Endkundenprodukt entwickelt. Hufi-Funktionen sollen sicher in **HufManager OS** integriert werden. Siehe [Migration/Produktbeschluss](docs/HUFIAPP_HUFMANAGER_OS_TRANSITION_2026-10-08.md) und [HufManager-OS-Source-of-Truth](https://github.com/passaondigital/hufmanager/blob/main/docs/product/HUFMANAGER_OS_PRODUCT_CANON_2026-10-08.md). Bestehende Dienste, Daten und Domains nicht ohne gesonderte Freigabe verändern; die Regeln dieses Dokuments bleiben verbindlich.

# Agent Instructions
<!-- HUFI_ACCOUNT_PROJECT_STANDARD_V1 -->
## HUFI Account Project Standard

These project-wide rules supplement, but do not replace, stricter project-specific instructions above.

Before substantial work:

1. Recover the current project truth before mutation.
2. Prefer local `00_START_HERE.md`, `PROJECT_MANIFEST.md`, `STATUS.md`, `DEPLOYMENT.md` and verified runtime facts for project-specific state.
3. Apply: **DISCOVER → VERIFY → REUSE → IMPLEMENT → TEST → VERIFY LIVE → DOCUMENT**.
4. Use only these status terms when describing capability state: `IDEA / PLANNED / FOUNDATION / BUILT / TESTED / STAGING / PRODUCTION / PARTIAL / BLOCKED / UNKNOWN`.
5. `NOT TESTED` is never `PASS`; `BUILT` is not `PRODUCTION`.
6. Before creating a framework, service, model, database or parallel implementation, inspect what can be reused.
7. Models/agents may assist with language, extraction, planning and implementation, but deterministic authority remains with code/policy for identity, permissions, money, billing state and destructive actions.
8. Never expose raw secrets in Git, prompts, normal documentation, memory or work evidence.
9. Before production, require appropriate rollback, tests, security checks, staging/smoke verification and post-deploy production smoke.
10. After substantial work, update durable project status so a future agent can continue without the old chat.

Public account foundation:
- `passaondigital/hufi-architecture-board/docs/00_UNIVERSAL_PROJECT_STANDARD.md`
- `passaondigital/hufi-architecture-board/docs/01_PROJECT_BOOTSTRAP.md`
- `passaondigital/hufi-architecture-board/docs/02_AGENT_RELEASE_STANDARD.md`

Authorized internal HUFI agents may additionally use the private reusable skill library:
- `passaondigital/hufi-factory/skills/`
- `passaondigital/hufi-factory/templates/PROJECT_STARTER/`

If a central source cannot be accessed, the embedded rules in this file still apply.

<!-- /HUFI_ACCOUNT_PROJECT_STANDARD_V1 -->
