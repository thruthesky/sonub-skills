# sonub-skills — Agent Skills von SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · **Deutsch** · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Dieses Repository ist ein **Skill-Marketplace**. Jeder Skill ist ein standardmäßiger [Agent Skill](https://agentskills.io) — ein Ordner mit einer `SKILL.md` — und funktioniert daher in Claude Code, Codex, Gemini CLI, GitHub Copilot CLI und jedem anderen Agenten, der Agent Skills liest. Claude Code kann ihn außerdem als Plugin aus diesem Marketplace (`sonub-skills`) installieren, sodass ein Update nur einen Befehl braucht.

| Skill | Was er macht |
|------|------|
| [`gp`](skills/gp) | Verwalte deine gesamte Arbeit in **GitHub Projects** mit git und der `gh` CLI |

---

## gp — deine gesamte Arbeit auf einem GitHub-Project-Board

Du sprichst mit deinem KI-Agenten in ganz normalen Worten — *„Erstelle ein Issue: Der Login-Button tut auf dem iPhone nichts, hänge diesen Screenshot an“*, *„Verschieb es nach Done“*, *„Füge eine Spalte Review hinzu“*, *„Was steht bei mir an?“* — und der Agent erledigt es mit `gh` auf deinem GitHub-Project-Board und liest das Ergebnis anschließend zur Bestätigung zurück.

### Was er abdeckt

- **GitHub Projects erklärt** — Repository, Issue, Projekt (Board), Item, Entwurf, Feld, Status = Spalten, Ansicht, Workflow. Dein Agent kann es dir in deiner Sprache erklären.
- **Konto und Anmeldung** — Schritte zur Registrierung eines neuen GitHub-Kontos, Installation von `gh`, `gh auth login`, die Scopes `project` und `repo`.
- **Boards** — erstellen, umbenennen, beschreiben, öffentlich/privat machen, schließen/wieder öffnen, löschen, Repositories verknüpfen, deine Boards auflisten, ein Standard-Board wählen.
- **Spalten (Kanban)** — hinzufügen, umbenennen (Karten bleiben), neu anordnen, einfärben, löschen (Karten vorher woandershin verschieben).
- **Felder und Ansichten** — benutzerdefinierte Felder (Text, Zahl, Datum, Einfachauswahl), Board-/Tabellen-/Roadmap-Ansichten mit Filtern.
- **Issues** — erstellen (in einer Spalte, mit Labels, Milestone, übergeordnetem Issue, benutzerdefinierten Feldern), bearbeiten, zwischen Spalten verschieben, schließen (wandert nach Done), wieder öffnen, kommentieren, vom Board entfernen, archivieren, löschen.
- **Bilder** — Screenshots oder Videos an den Text eines Issues oder an einen Kommentar anhängen.
- **TODO** — eine `- [ ]`-Checkliste in einem Issue: hinzufügen, abhaken, Haken entfernen, löschen; der Fortschritt wird in Listen angezeigt. Entwurfs-Items für schnelle Ideen, die später in Issues umgewandelt werden.
- **Personen** — zuweisen und Zuweisung aufheben, sehen, wer was hat, Mitarbeitende zu einem Repository einladen und Board-Rollen vergeben.

### Voraussetzungen

- Ein GitHub-Konto (kostenlos). Noch kein Konto? Registriere dich unter https://github.com/signup — E-Mail-Code, Puzzle, Free-Tarif (etwa drei Minuten).
- [`gh`](https://cli.github.com) — die GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), angemeldet mit den Scopes `project` und `repo`.
- Python 3.8 oder neuer (nur die Standardbibliothek).

### Installation

**Am einfachsten — lass es deinen Agenten machen.** Kopiere diesen Kasten in Claude Code, Codex, Gemini CLI oder Copilot CLI und sende ihn ab:

```text
Installiere den Skill gp aus dem Repository thruthesky/sonub-skills.
Skill-Pfad: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — ein standardmäßiger Agent Skill (ein Ordner mit SKILL.md).

1. Wenn du Claude Code bist, installiere ihn als Plugin und führe diese Befehle der Reihe nach aus (Fehler wie „already added“ ignorieren):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Wenn er schon installiert ist, führe stattdessen aus: claude plugin update gp@sonub-skills
2. Jeder andere Agent: Lege ihn in deinen Benutzer-Skill-Ordner DIR (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills).
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Führe aus: python3 <Skill-Ordner>/scripts/gp.py doctor — und behebe, was es meldet (gh installieren, gh auth login, gh auth refresh -s project,repo).
4. Sag mir kurz, was installiert wurde, das Ergebnis von doctor und dass ich jetzt Dinge sagen kann wie „Zeig meine GitHub-Projekte“.
```

**Claude Code — zwei Zeilen im Terminal** (funktioniert in jeder Version):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

In einem Chat verwendest du `/plugin marketplace add thruthesky/sonub-skills` und danach `/plugin install gp@sonub-skills`. Neuere Versionen akzeptieren auch eine einzige Zeile: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Nach der Installation im Terminal führe in einem offenen Chat `/reload-plugins` aus (oder starte neu).

**Jeder Agent — Ordner kopieren** in den Skill-Ordner des Agenten:

| Werkzeug | Benutzer-Skill-Ordner | Projekt-Skill-Ordner |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### Erster Start

Bitte deinen Agenten *„Richte gp ein“* (Claude Code: `/gp:gp`, Codex: `$gp`). Er führt aus:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · angemeldet ✓ · Scopes ✓ · Standard-Board
gh auth login                                   # nur wenn nicht angemeldet — Einmalcode im Browser eingeben
gh auth refresh -s project,repo                 # nur wenn ein Scope fehlt
python3 scripts/gp.py projects                  # deine Boards
python3 scripts/gp.py use <owner> <number>      # eins auswählen … oder eins erstellen:
python3 scripts/gp.py project-create --title "Meine Arbeit" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Benutzung — einfach sagen

| Du sagst | Der Agent führt aus |
|------|------|
| „Erstelle ein Issue: Der Login-Button tut auf dem iPhone nichts. Schritte: reproduzieren, beheben, testen. Hänge shot.png an“ | `create --repo app --title "…" --todo reproduzieren --todo beheben --todo testen --image shot.png` → Spalte Todo |
| „Setz es auf in Arbeit“ · „Verschieb #12 nach Review“ | `move app#12 doing` · `move app#12 review` |
| „Fertig!“ | `close app#12` — schließt das Issue und verschiebt es nach Done |
| „Füge ‚Doku aktualisieren‘ zu seinem TODO hinzu“ · „Hak den ersten ab“ | `todo app#12 add "Doku aktualisieren"` · `todo app#12 done 1` |
| „Füge vorne eine Spalte Urgent hinzu“ · „Benenne Review in QA um“ | `column-add Urgent --first --color red` · `column-rename Review QA` |
| „Gib es alice“ · „Lade bob ins Repo ein“ | `assign app#12 alice` · `invite bob --repo app` (fragt vorher) |
| „Was steht bei mir an?“ | `list --assignee @me --state open`, dann schlägt er eine nächste Aufgabe vor |
| „Notiere eine Idee auf dem Board: Dunkelmodus“ | `create --draft --title "Dunkelmodus"` |
| „Füge ein Feld Priority hinzu“ | `field-add Priority --type single_select --options "High,Medium,Low"` |

Alle Befehle: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### So funktioniert es

- **Nur `gh` und die Python-Standardbibliothek.** gh wird mit einer Argumentliste aufgerufen (ohne Shell), und Titel und Texte laufen über stdin — Anführungszeichen, Emojis und Zeilenumbrüche machen nie etwas kaputt.
- **IDs über den Namen.** Feld-, Spalten- und Options-IDs werden bei jedem Lauf nachgeschlagen, daher kannst du Spalten auf der Website umbenennen, ohne etwas kaputtzumachen. Beim Umbenennen einer Spalte bleiben ihre Karten erhalten.
- **Jede Änderung wird zurückgelesen.** Nach einer Änderung gibt das Skript eine `check:`-Zeile mit dem tatsächlichen Zustand auf GitHub aus (Status, Spalte, zugewiesene Personen, Labels). Der Agent berichtet auf dieser Grundlage.
- **Bilder** nutzen `--attach` von gh (GitHub user-attachments). Mit einer älteren gh-Version werden Bilder in einen Branch `gp-assets` des Issue-Repositorys committet und verlinkt.
- **Standardmäßig sicher.** Jeder ändernde Befehl hat `--dry-run`. Das Löschen eines Issues, eines Boards, eines Felds oder einer Spalte mit Karten erfordert `--yes`, und der Skill weist den Agenten an, dich vorher zu fragen. Bei Einladungen (die einer echten Person eine E-Mail schicken) wird ebenfalls vorher gefragt.
- **Das Standard-Board** wird in `~/.config/gp/config.json` gespeichert; überschreibe es mit `--owner/--number` oder `GP_OWNER`/`GP_PROJECT`.

Hinweis: Direkt nach dem Erstellen eines Issues kann es einige Sekunden dauern, bis die Projektliste auf GitHub es anzeigt. Die `check:`-Zeile liest das Issue direkt und ist immer aktuell.

### Aktualisieren und entfernen

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Andere Agenten: Führe die Zeile `curl … | tar` erneut aus, um zu aktualisieren; lösche den Ordner `gp`, um ihn zu entfernen.

### Aufbau des Repositorys

```
.claude-plugin/marketplace.json   ← der Marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← der Skill: wann und wie man ihn benutzt
├─ .claude-plugin/plugin.json     ← Plugin-Infos (nur Claude Code; andere Werkzeuge ignorieren sie)
├─ scripts/gp.py                  ← das Werkzeug
└─ references/                    ← bei Bedarf lesen
   ├─ github-projects.md          ← Konzepte, Konto, Anmeldung, erstes Board
   └─ commands.md                 ← alle Befehle + reine gh-/GraphQL-Rezepte
```

Wie Skills funktionieren, lernst du im Kapitel **Agent Skills** des SONUB-KI-Kurses: https://sonub.com/de/learn/ai#agent-skill

Lizenz: [MIT](LICENSE)
