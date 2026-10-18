# sonub-skills — Agent Skills von SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · **Deutsch** · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Dieses Repository ist ein **Skill-Marketplace**. Jeder Skill ist ein standardmäßiger [Agent Skill](https://agentskills.io) — ein Ordner mit einer `SKILL.md` — und funktioniert daher in Claude Code, Codex, Gemini CLI, GitHub Copilot CLI und jedem anderen Agenten, der Agent Skills liest. Claude Code kann ihn außerdem als Plugin aus diesem Marketplace (`sonub-skills`) installieren, sodass ein Update nur einen Befehl braucht.

| Skill | Was er macht |
|------|------|
| [`gp`](skills/gp) | Verwalte deine gesamte Arbeit in **GitHub Projects** mit git und der `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **Claude Code lernen und immer besser nutzen** — 14 Lektionen mit Quiz, Antworten aus der offiziellen Doku geprüft, ein Check deines Setups, jede neue Funktion aus dem CHANGELOG zusammengefasst und `/claude-skill update`, um neue nachzuladen (Plugin-Name `cc-skill`) |
| [`popup`](skills/popup) | **Fachbegriffe mit Hover-Popups erklären** — auf den Seiten und in der Doku jedes Projekts: Bedeutung, einfache Worte, Beispiele, Quellcode, verwandte Begriffe und „Mehr erfahren“-Links zu deinen eigenen Seiten, alles aus einer einzigen Glossar-JSON |

## Installation — global (Benutzer) oder pro Projekt

Jeder Skill wird auf dieselbe Weise installiert. Setze für `<plugin>` den Plugin-Namen aus der Tabelle ein (`gp`, `cc-skill`, `popup`).

**Schritt 1 — Marketplace hinzufügen (einmal pro Computer)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Schritt 2 — dort installieren, wo du es haben willst**

| Bereich | Befehl | Wer bekommt es, wo | Gespeichert in |
|------|------|------|------|
| **Global (Benutzer)** — Standard | `claude plugin install <plugin>@sonub-skills` | du, in jedem Projekt auf diesem Computer | `~/.claude/settings.json` |
| **Projekt (mit dem Team geteilt)** | im Projektordner: `claude plugin install <plugin>@sonub-skills --scope project` | alle, die in diesem Repository arbeiten | `.claude/settings.json` (committen) |
| **Lokal (nur du, nur dieses Projekt)** | im Projektordner: `claude plugin install <plugin>@sonub-skills --scope local` | du, nur in diesem Repository | `.claude/settings.local.json` |

- In einer Sitzung öffnet `/plugin install <plugin>@sonub-skills` einen Bildschirm, auf dem du den Bereich auswählst. Wenn du im Terminal installiert hast, führe in jeder offenen Sitzung `/reload-plugins` aus.
- Prüfen: `claude plugin list` (zeigt den Bereich). Aktualisieren: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Entfernen: `claude plugin uninstall <plugin>@sonub-skills`.
- Ist dasselbe Plugin in mehreren Bereichen eingetragen, schlägt lokal das Projekt und das Projekt global.

**Dein Team bekommt es automatisch** — committe das in die `.claude/settings.json` des Repositorys. Sobald jemand aus dem Team dem Ordner vertraut, fügt Claude Code den Marketplace hinzu und installiert die Plugins.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Ohne Plugins — Ordner kopieren** in den Skill-Ordner deines Agenten (`<skill>` = `gp`, `claude-skill` oder `popup`).

| Werkzeug | Global (Benutzer) | Projekt |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<Projekt>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<Projekt>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # nur dieses Projekt: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Am einfachsten** — sag deinem Agenten *„Installiere das Plugin cc-skill aus thruthesky/sonub-skills global“* (oder *„nur für dieses Projekt“*), und er führt die Befehle oben für dich aus.

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
   - Wenn ich „nur für dieses Projekt“ gesagt habe, führe die letzte Zeile im Projektordner aus und hänge --scope project an.
   - Wenn er schon installiert ist, führe stattdessen aus: claude plugin update gp@sonub-skills
2. Jeder andere Agent: Lege ihn in den Skill-Ordner DIR — alle Projekte: ~/.agents/skills, nur dieses Projekt: <Projekt>/.agents/skills.
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

#### Globale Installation und lokale (Projekt-)Installation

| | Global — alle Projekte | Lokal — nur dieses Projekt |
|------|------|------|
| Claude Code Plugin | `claude plugin install gp@sonub-skills` | im Projektordner: `claude plugin install gp@sonub-skills --scope project` (wird in `.claude/settings.json` geschrieben und mit dem Team geteilt · nur für dich: `--scope local`) |
| Claude Code Ordnerkopie | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Zu verwendendes Board | `/gp init <Board-URL> --global` → `~/.config/gp/config.json` | `/gp init <Board-URL>` → `<Projekt>/.gp.json` |

Wo der Skill installiert ist und welches Board er verwendet, wird getrennt festgelegt. Meist installierst du den Skill einmal global und gibst jedem Projekt mit `/gp init <Board-URL>` sein eigenes Board.

### Erster Start

Bitte deinen Agenten *„Richte gp ein“* (Claude Code: `/gp:gp`, Codex: `$gp`). Er führt aus:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · angemeldet ✓ · Scopes ✓ · Standard-Board
gh auth login                                   # nur wenn nicht angemeldet — Einmalcode im Browser eingeben
gh auth refresh -s project,repo                 # nur wenn ein Scope fehlt
python3 scripts/gp.py projects                  # deine Boards
python3 scripts/gp.py init <Board-URL>          # Board dieses Projekts (.gp.json) · alle Projekte: --global … oder eins erstellen:
python3 scripts/gp.py project-create --title "Meine Arbeit" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Board wählen — `/gp init`

Jedes Entwicklungsprojekt kann sein eigenes GitHub-Project-Board haben. Gib deinem Agenten im Projektordner die Adresse des Boards, dann landet die Arbeit dieses Projekts auf diesem Board.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Als Claude-Code-Plugin installiert: `/gp:gp init …`; Codex: `$gp init …`. Auch „Nimm https://… als Board für dieses Projekt“ funktioniert.

- **Lokal (Standard)** — innerhalb eines git-Repositorys wird es in `<Repository-Wurzel>/.gp.json` gespeichert und nur in diesem Projekt (und seinen Unterordnern) verwendet. Die Datei enthält keine Geheimnisse: Committe sie, damit dein Team dasselbe Board nutzt, oder trage sie in `.gitignore` ein, um sie für dich zu behalten.
- **Global** — `/gp init <URL> --global` (oder „Mach es zum Standard-Board für alle Projekte“) → `~/.config/gp/config.json`, wird in jedem Ordner ohne `.gp.json` verwendet.
- Jede Seite des Boards funktioniert (`/views/2`, Benutzer-Boards `/users/…`, Organisations-Boards `/orgs/…`). Vor dem Speichern wird geprüft, ob das Board existiert und lesbar ist.
- `/gp init` allein zeigt das verwendete Board und seine Einstellungsdatei. Entfernen: `gp.py init --unset` (global: `--unset --global`).
- Welches Board verwendet wird: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → `.gp.json` des Projekts → die globale Einstellung.

### Benutzung — einfach sagen

| Du sagst | Der Agent führt aus |
|------|------|
| „Erstelle ein Issue: Der Login-Button tut auf dem iPhone nichts. Schritte: reproduzieren, beheben, testen. Hänge shot.png an“ | `create --repo app --title "…" --todo reproduzieren --todo beheben --todo testen --image shot.png` → Spalte Todo |
| „/gp init https://github.com/orgs/my-team/projects/3“ | `init …` → als Board dieses Projekts gespeichert (`.gp.json`) |
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
- **Die Board-Einstellung** wird pro Projekt in `.gp.json` (lokal) und für alle Projekte in `~/.config/gp/config.json` (global) gespeichert. `--owner/--number` oder `GP_OWNER`/`GP_PROJECT` haben Vorrang vor beiden.

Hinweis: Direkt nach dem Erstellen eines Issues kann es einige Sekunden dauern, bis die Projektliste auf GitHub es anzeigt. Die `check:`-Zeile liest das Issue direkt und ist immer aktuell.

### Aktualisieren und entfernen

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Andere Agenten: Führe die Zeile `curl … | tar` erneut aus, um zu aktualisieren; lösche den Ordner `gp`, um ihn zu entfernen.

## claude-skill — Claude Code lernen und immer besser nutzen

Claude Code bringt fast jeden Tag eine neue Version heraus (bisher über 400). Dieser Skill bringt es dir der Reihe nach bei, beantwortet Fragen aus der **aktuellen offiziellen Doku** statt aus dem Gedächtnis, prüft dein Setup und führt eine Zusammenfassung jeder neuen Funktion aus dem CHANGELOG. Ein einziges `/claude-skill update` holt neu erschienene Funktionen in den Skill.

### Was er abdeckt

- **Ein Lernpfad mit 14 Lektionen** — von der Installation und den ersten Prompts über Erkunden → Planen → Coden → Committen, Kontextverwaltung, CLAUDE.md und Memory, Berechtigungsmodi, Checkpoints, Skills, Subagents, Hooks, MCP, Plugins und Marketplaces, Headless-Läufe und GitHub Actions bis hin zu langer, unbeaufsichtigter Arbeit mit Überprüfung. Jede Lektion hat eine **Übung in deinem eigenen Projekt** und Kontrollfragen, und dein Fortschritt wird gespeichert.
- **Claude Academy, analysiert** — die 64 Claude-Tutorials der [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) sowie die Claude-Code-Tutorials und -Kurse (Claude Code 101, Claude Code in action, Agent Skills, Subagents); was du im Chat lernst (Projects, Memory, Connectors, Skills, Research, Wahl von Modell und Effort…), wird dem gegenübergestellt, wie du es in Claude Code machst.
- **Antworten aus der Doku geprüft** — bei „Wie funktionieren Hooks?“ oder „Was ist ein Plugin-Bereich?“ sucht und liest er code.claude.com und antwortet mit dem Befehl, einem Beispiel und dem Link zur Doku.
- **Jede neue Funktion aus dem CHANGELOG** — alle 422 Versionen der [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), ohne Bugfixes, zusammengefasst in 14 Themen, dazu die 30 Funktionen, die man kennen sollte, und die neuesten Ergänzungen.
- **`/claude-skill update`** — holt den neuesten CHANGELOG, findet die Versionen, die der Skill noch nicht abdeckt, trägt ihre Funktionen in die Notizen, den Spickzettel und die Lektionen ein und vermerkt, bis wohin er aktuell ist.
- **Setup-Check** — prüft deine Version, die Einstellungsdateien (Benutzer, Projekt, lokal), die Länge der CLAUDE.md, Regeln, Auto-Memory, Skills, Subagents, Plugins und MCP-Server und schlägt Verbesserungen vor.
- **Spickzettel, Tipps und Bauanleitungen** — Befehle, Tastenkürzel, CLI-Flags und Dateipfade auf einer Seite; Gewohnheiten, die funktionieren; wie man Skills, Subagents, Hooks, MCP-Server, Plugins und Marketplaces baut.

### Installation

Wie oben unter [Installation](#installation--global-benutzer-oder-pro-projekt). Das Plugin heißt **`cc-skill`** (Claude Code reserviert Plugin-Namen, die mit `claude-` beginnen, für Anthropics eigene). Der Skill behält den Namen `claude-skill`, du rufst ihn also mit `/claude-skill` auf.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — alle Projekte
claude plugin install cc-skill@sonub-skills --scope project    # dieses Projekt, mit dem Team geteilt
```

Braucht Python 3.8+ und Internetzugang (er liest die offizielle Doku und den CHANGELOG).

### Benutzung

| Du sagst | Er macht |
|------|------|
| `/claude-skill` · „Lass uns Claude Code lernen“ | Zeigt die Lektionen und deinen Fortschritt und startet die nächste |
| `/claude-skill lesson 5` · „Nächste Lektion“ | Bringt sie dir bei, macht die Übung in deinem Projekt, stellt Kontrollfragen und speichert den Fortschritt |
| `/claude-skill quiz` | Fünf Fragen zu dem, was du gelernt hast, eine nach der anderen, mit Punktzahl |
| „Wie lasse ich prettier nach jeder Änderung per Hook laufen?“ | Liest die offizielle Doku und antwortet mit einem Konfigurationsbeispiel und dem Link |
| `/claude-skill new` · „Was gibt’s Neues?“ | Die nützlichsten neuen Funktionen zuerst, jeweils mit einer Anleitung zum Ausprobieren |
| `/claude-skill doctor` · „Prüf mein Setup“ | Überprüft dein Setup und schlägt Verbesserungen vor (fragt, bevor er etwas ändert) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Gewohnheiten, die funktionieren · Befehle und Tastenkürzel · die Academy-Analyse |
| `/claude-skill build skill` · „Bau mir einen Hook“ | Wählt den passenden Mechanismus und baut ihn mit dir in deinem Projekt |
| `/claude-skill update` | Aktualisiert die Funktionsnotizen des Skills aus dem neuesten CHANGELOG |

Als Plugin installiert funktioniert auch `/cc-skill:claude-skill …`. Codex: `$claude-skill …`.

### So funktioniert `/claude-skill update`

1. `scripts/cc.py update-check` vergleicht die Version, bis zu der die Notizen reichen (die Markierung `covered-through` in `references/changelog-features.md`), mit der neuesten Version im CHANGELOG.
2. Bei einer als Plugin installierten Kopie führt er zuerst `claude plugin update cc-skill@sonub-skills` aus, um die veröffentlichten Notizen zu holen. Um die Quelle des Skills (einen git-Checkout) zu bearbeiten, übergib `--source <Ordner>`. Ohne Quelle schreibt er in `~/.config/claude-skill/changelog-local.md`, das Plugin-Updates übersteht.
3. `cc.py changelog --since <abgedeckte Version>` listet die Einträge der neuen Versionen auf (Bugfixes ausgeblendet); der Agent ordnet neue Funktionen ihren Themen zu, schreibt die „neuesten Ergänzungen“ neu, nimmt neue Befehle und Tastenkürzel in den Spickzettel auf und korrigiert Lektionen, die nicht mehr stimmen.
4. `cc.py mark-covered <neueste Version>` verschiebt die Markierung; in einem git-Checkout erhöht er die Versionsnummer und committet (pusht nur, wenn du darum bittest).
5. Er meldet den abgedeckten Bereich und 3–7 neue Funktionen, die sich lohnen, jeweils mit einer Anleitung zum Ausprobieren.

### Das Werkzeug — `scripts/cc.py`

Nur die Python-Standardbibliothek.

```bash
python3 scripts/cc.py doctor                 # dein Claude-Code-Setup prüfen + Tipps
python3 scripts/cc.py docs hooks             # die offizielle Doku durchsuchen (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # einen Abschnitt einer Seite lesen
python3 scripts/cc.py changelog --count 5    # die neuesten 5 Versionen (Bugfixes ausgeblendet)
python3 scripts/cc.py changelog --grep worktree --count 400   # eine Funktion über ihren Namen finden
python3 scripts/cc.py update-check           # abgedeckte Versionen vs. neueste
python3 scripts/cc.py lessons                # Lektionen und Fortschritt
```

## popup — jedes schwere Wort dort erklären, wo der Leser darauf stößt

Ein Leser bleibt an einem unbekannten Wort hängen — „Token“, „Endpoint“, „idempotent“ — und verliert den ganzen Absatz. Dieser Skill setzt auf dieses Wort eine kleine Karte: Fahre mit der Maus darüber (am Handy tippen, per Tastatur fokussieren), und sie erklärt den Begriff in Schichten — Bedeutung in einer Zeile, eine kurze Erklärung, einen Vergleich aus dem Alltag, Beispielzeilen, einen Quellcode-Ausschnitt, verwandte Begriffe und einen **„Mehr erfahren“-Link auf eine andere Seite deines eigenen Projekts**. Er funktioniert in jedem Projekt: statische Seiten, Dokumentationsgeneratoren, Single-Page-Apps, serverseitig gerenderte Seiten und schlichtes Markdown, das auf GitHub gelesen wird.

### Was er abdeckt

- **Ein Glossar, ein Ort** — jede Erklärung steht in einer einzigen JSON-Datei (oder eine pro Sprache); die Seiten verweisen nur auf Begriffs-IDs, sodass dasselbe Wort überall gleich gelesen wird.
- **Ein fertiges Kit** — `popup.js` und `popup.css`, ohne Framework und ohne Build-Schritt. Einfacher Text in `main`/`article` wird automatisch umschlossen (beim ersten Vorkommen pro Seite); für Wendungen, Sätze, „?“-Buttons und Links mit Hover-Vorschau gibt es ausdrückliche Auszeichnung. Eine Karte pro Seite, per Klick fixierbar, verwandte Chips wechseln den Inhalt an Ort und Stelle, Esc gibt den Fokus zurück, Bottom Sheet am Handy, Sprachen von rechts nach links, Dunkelmodus und Themes über CSS-Variablen.
- **Kluges Erkennen** — die längste Schreibweise zuerst, Wortgrenzen je Schrift (lateinisch, kyrillisch, koreanische Partikeln, arabische Präfixe, CJK), Begriffe, die nur in einem Abschnitt gelten (`scope`), und Befehlsnamen mit Groß-/Kleinschreibung.
- **Schreibregeln** — wie du eine Karte schreibst, die ein Einsteiger beim ersten Lesen versteht, in jeder Sprache, die das Projekt ausliefert: wofür jedes Feld da ist, Längen, ein Vergleich, geprüfte Fakten und Beispiele, wann immer es echte gibt.
- **Werkzeuge** — `popup.py check` prüft das Glossar (alle Locales, Beispielcode in allen Sprachen identisch, verwandte IDs, Ziele der „Mehr erfahren“-Links vorhanden, Schreibweisen-Konflikte); `audit` zeigt, welche Begriffe ein Dokument schon nutzt, und findet Fachjargon ohne Eintrag; `add` führt neue Begriffe sicher zusammen; `md` + `link` machen aus dem Glossar eine `GLOSSARY.md` und verlinken das erste Vorkommen in deinen Markdown-Dateien, mit der Bedeutung als Hover-Title.
- **SONUB** — im SONUB-Repository baut er auf dem eigenen Laravel-Glossar von SONUB auf (17 Sprachen, die Stimme des KI-Tutors), statt ein zweites System anzulegen.

### Installation

Wie oben unter [Installation](#installation--global-benutzer-oder-pro-projekt), mit dem Plugin-Namen **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — alle Projekte
claude plugin install popup@sonub-skills --scope project    # dieses Projekt, mit dem Team geteilt
```

Das Werkzeug braucht Python 3.8+. Das Kit läuft in jedem modernen Browser.

### Benutzung

| Du sagst | Er macht |
|------|------|
| `/popup docs/getting-started.md` · „Füg dieser Seite Glossar-Popups hinzu“ | Findet die schweren Wörter, schreibt die Einträge, bindet das Kit ein und prüft es im Browser |
| `/popup token, sampling, temperature` | Schreibt diese drei Einträge und hängt sie dort an, wo sie vorkommen |
| „Erkläre die Menüpunkte beim Darüberfahren“ | Fügt Links Hover-Vorschauen hinzu, mit „?“-Buttons für Handys und Tastaturen |
| „Mach die README einsteigerfreundlich“ | Erstellt die `GLOSSARY.md` und verlinkt das erste Vorkommen jedes Begriffs, mit der Bedeutung beim Darüberfahren |
| „Übersetze das Glossar ins Japanische“ | Ergänzt `ja` in jedem Eintrag und prüft, dass nichts fehlt |

Als Plugin installiert funktioniert auch `/popup:popup …`. Codex: `$popup …`.

### Das Werkzeug — `scripts/popup.py`

Nur die Python-Standardbibliothek.

```bash
python3 scripts/popup.py init popup --locales en,ko   # kopiert popup.js/css, legt glossary.json an, schreibt .popup.json
python3 scripts/popup.py audit docs                   # genutzte Begriffe pro Datei + Jargon ohne Eintrag
python3 scripts/popup.py add new-terms.json --dry-run # neue Begriffe zusammenführen (geprüft, überschreibt nie stillschweigend)
python3 scripts/popup.py check                        # Glossar prüfen
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown auf GitHub
```

Dann füge deinem Layout zwei Tags hinzu:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Aufbau des Repositorys

```
.claude-plugin/marketplace.json   ← der Marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← der Skill: wann und wie man ihn benutzt
├─ .claude-plugin/plugin.json     ← Plugin-Infos (nur Claude Code; andere Werkzeuge ignorieren sie)
├─ scripts/gp.py                  ← das Werkzeug
└─ references/                    ← bei Bedarf lesen
   ├─ github-projects.md          ← Konzepte, Konto, Anmeldung, erstes Board
   └─ commands.md                 ← alle Befehle + reine gh-/GraphQL-Rezepte
skills/claude-skill/
├─ SKILL.md                       ← der Skill: wann und wie man ihn benutzt
├─ .claude-plugin/plugin.json     ← Plugin-Infos (Plugin-Name cc-skill)
├─ scripts/cc.py                  ← Lernwerkzeug: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 Lektionen · Academy-Analyse · CHANGELOG-Funktionen · Spickzettel · Bauanleitungen · Tipps · Quiz
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← der Skill: wann und wie man ihn benutzt
├─ .claude-plugin/plugin.json     ← Plugin-Infos
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← Werkzeuge nur für SONUB (Laravel-Glossar)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Wie Skills funktionieren, lernst du im Kapitel **Agent Skills** des SONUB-KI-Kurses: https://sonub.com/de/learn/ai#agent-skill

Lizenz: [MIT](LICENSE)
