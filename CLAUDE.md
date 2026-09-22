# HufiApp – Claude Code Kontext

## Projekt
- **App**: HufiApp (hufiapp.de) – KI-Assistent für Pferdebesitzer und -profis
- **Tech Stack**: Vite + React + TypeScript + Tailwind + shadcn-ui + Supabase
- **Supabase-Projekt**: `oortmejcefbiewaceccc`

## Infrastruktur (Stand: September 2026)

### Server-Übersicht

| Name | IP | User | OS | Rolle |
|------|-----|------|----|-------|
| **TOWER** | lokal | pascal | Linux Mint | Steuerzentrale, Terminal, SSH-Start |
| **XXL** | 85.190.105.104 | administrator | Ubuntu 26.04 | Hauptserver (HufiCloud, hufiapp.de, HufManager) |
| **MR.EQUI** | 85.190.105.24 | administrator | Ubuntu 22.04 | OpenClaw, Telegram, Orchestrierung |
| **OVH** | 57.131.151.73 | ubuntu | Ubuntu 24.04 | Zusatz-/Testserver (Frankfurt) |

### XXL-Server (Hauptserver für hufiapp.de)
- **Prompt**: `administrator@cloud-server-10634828:~$`
- **Ressourcen**: 16 vCPU, ~32 GB RAM, ~800 GB
- **SSH-Kurzbefehl** (vom Tower): `@xxl`
- **Dienste auf XXL**: HufiCloud, HufiLab, HufiBusiness, HufiJunior, HufiFactory, Hermes, Qwen lokal, HufManager

### hufiapp.de auf XXL
- Deployment-Pfad: `/srv/hufi/hufiapp/dist` (Vite-Build-Output)
- Nginx-Config: `deployment/nginx.conf` → kopieren nach `/etc/nginx/sites-available/hufiapp`
- Public-Zugriff ausschließlich über nginx/HTTPS
- Kein Lovable mehr – selbst gehostet auf XXL

### SSH-Kurzbefehle (auf dem Tower)
```
@xxl      → XXL-Hauptserver
@mr       → MrEqui/OpenClaw
@ovh      → OVH-VPS
@factory  → XXL + /srv/hufi/lab/factory
@claude   → XXL + HufiFactory + Claude Code
```

## Deployment-Ablauf (XXL)

```bash
# 1. Lokal bauen
npm run build  # oder: bun run build

# 2. dist-Ordner auf den XXL-Server kopieren
rsync -avz --delete dist/ administrator@85.190.105.104:/srv/hufi/hufiapp/dist/

# 3. nginx neu laden (nur beim ersten Mal: sites-enabled-Link setzen)
# XXL → nginx -t && systemctl reload nginx
```

## Nginx-Fix (wichtig für SPA-Routing)
Die App nutzt React Router `BrowserRouter`. Nginx **muss** die SPA-Fallback-Regel haben:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
→ Ohne diese Regel zeigt nginx bei direktem URL-Aufruf (z.B. `/app/chat`) die falsche Seite.

## Regeln
- Keine Passwörter/Secrets in dieses Dokument
- Bei Terminal-Befehlen immer angeben: TOWER → / XXL → / MR.EQUI → / OVH →
- HufManager-Produktion nicht ohne Prüfung verändern
- Öffentliche Apps nur über nginx/HTTPS, nicht direkt exponieren
