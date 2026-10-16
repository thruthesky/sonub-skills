# sonub-skills — Agent Skills de SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · **Español** · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Este repositorio es un **marketplace de skills**. Cada skill es un [Agent Skill](https://agentskills.io) estándar (una carpeta con un `SKILL.md`), así que funciona en Claude Code, Codex, Gemini CLI, GitHub Copilot CLI y cualquier otro agente que lea Agent Skills. Claude Code también puede instalarlo como plugin desde este marketplace (`sonub-skills`), de modo que actualizarlo es un solo comando.

| Skill | Qué hace |
|------|------|
| [`gp`](skills/gp) | Gestiona todo tu trabajo en **GitHub Projects** con git y la CLI `gh` |

---

## gp — todo tu trabajo en un tablero de GitHub Project

Le hablas a tu agente de IA con palabras normales — *"crea un issue: el botón de inicio de sesión no hace nada en iPhone, adjunta esta captura"*, *"muévelo a Done"*, *"añade una columna Review"*, *"¿qué tengo pendiente?"* — y el agente lo hace en tu tablero de GitHub Project con `gh`, y luego vuelve a leer el resultado para confirmarlo.

### Qué cubre

- **GitHub Projects explicado** — repositorio, issue, proyecto (tablero), elemento (item), borrador (draft), campo (field), Status = columnas, vista, flujo de trabajo (workflow). Tu agente te lo puede enseñar en tu idioma.
- **Cuenta e inicio de sesión** — pasos para crear una cuenta nueva de GitHub, instalar `gh`, `gh auth login`, los permisos (scopes) `project` y `repo`.
- **Tableros** — crear, renombrar, describir, hacer público/privado, cerrar/reabrir, eliminar, vincular repositorios, listar tus tableros, elegir un tablero por defecto.
- **Columnas (kanban)** — añadir, renombrar (las tarjetas se quedan), reordenar, poner color, eliminar (primero mueve las tarjetas a otra columna).
- **Campos y vistas** — campos personalizados (texto, número, fecha, selección única), vistas de tablero/tabla/hoja de ruta con filtros.
- **Issues** — crear (en una columna, con etiquetas, hito, issue padre, campos personalizados), editar, mover entre columnas, cerrar (pasa a Done), reabrir, comentar, quitar del tablero, archivar, eliminar.
- **Imágenes** — adjuntar capturas de pantalla o vídeos al cuerpo de un issue o a un comentario.
- **TODO** — una lista de verificación `- [ ]` dentro de un issue: añadir, marcar, desmarcar, quitar; el progreso se muestra en las listas. Elementos borrador para ideas rápidas, que luego se convierten en issues.
- **Personas** — asignar y quitar responsables, ver quién tiene qué, invitar colaboradores a un repositorio y dar roles en el tablero.

### Requisitos

- Una cuenta de GitHub (gratis). ¿Aún no tienes cuenta? Regístrate en https://github.com/signup — código por correo electrónico, rompecabezas, plan Free (unos tres minutos).
- [`gh`](https://cli.github.com) — la CLI de GitHub (macOS `brew install gh`, Windows `winget install GitHub.cli`), con la sesión iniciada con los permisos `project` y `repo`.
- Python 3.8 o posterior (solo la biblioteca estándar).

### Instalación

**Lo más fácil — que lo haga tu agente.** Copia este recuadro en Claude Code, Codex, Gemini CLI o Copilot CLI y envíalo:

```text
Instala el skill gp del repositorio thruthesky/sonub-skills.
Ruta del skill: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — un Agent Skill estándar (una carpeta con SKILL.md).

1. Si eres Claude Code, instálalo como plugin ejecutando esto en orden (ignora los errores de "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Si ya está instalado, ejecuta en su lugar: claude plugin update gp@sonub-skills
2. Cualquier otro agente: ponlo en tu carpeta de skills de usuario DIR (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills).
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Ejecuta: python3 <carpeta del skill>/scripts/gp.py doctor — y corrige lo que indique (instalar gh, gh auth login, gh auth refresh -s project,repo).
4. Dime brevemente qué se instaló, el resultado de doctor, y que ya puedo decir cosas como "muestra mis proyectos de GitHub".
```

**Claude Code — dos líneas en una terminal** (funciona en todas las versiones):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

En un chat usa `/plugin marketplace add thruthesky/sonub-skills` y después `/plugin install gp@sonub-skills`. Las versiones más nuevas también aceptan una sola línea: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Si instalaste desde una terminal, ejecuta `/reload-plugins` en un chat abierto (o reinicia).

**Cualquier agente — copia la carpeta** en la carpeta de skills del agente:

| Herramienta | Carpeta de skills de usuario | Carpeta de skills del proyecto |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### Primera ejecución

Pídele a tu agente *"configura gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Ejecuta:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · sesión iniciada ✓ · permisos ✓ · tablero por defecto
gh auth login                                   # solo si no has iniciado sesión — escribe el código de un solo uso en el navegador
gh auth refresh -s project,repo                 # solo si falta un permiso
python3 scripts/gp.py projects                  # tus tableros
python3 scripts/gp.py use <owner> <number>      # elige uno … o crea uno:
python3 scripts/gp.py project-create --title "Mi trabajo" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Cómo usarlo — solo dilo

| Tú dices | El agente ejecuta |
|------|------|
| "Crea un issue: el botón de inicio de sesión no hace nada en iPhone. Pasos: reproducir, corregir, probar. Adjunta shot.png" | `create --repo app --title "…" --todo reproducir --todo corregir --todo probar --image shot.png` → columna Todo |
| "Ponlo en progreso" · "Mueve #12 a Review" | `move app#12 doing` · `move app#12 review` |
| "¡Hecho!" | `close app#12` — cierra el issue y lo mueve a Done |
| "Añade 'actualizar la documentación' a su TODO" · "marca el primero" | `todo app#12 add "actualizar la documentación"` · `todo app#12 done 1` |
| "Añade una columna Urgent al principio" · "Cambia el nombre de Review a QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "Asígnaselo a alice" · "Invita a bob al repositorio" | `assign app#12 alice` · `invite bob --repo app` (pregunta antes) |
| "¿Qué tengo pendiente?" | `list --assignee @me --state open`, y luego sugiere una próxima tarea |
| "Anota una idea en el tablero: modo oscuro" | `create --draft --title "modo oscuro"` |
| "Añade un campo Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

Todos los comandos: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Cómo funciona

- **Solo `gh` y la biblioteca estándar de Python.** gh se llama con una lista de argumentos (sin shell), y los títulos y cuerpos se envían por la entrada estándar (stdin): las comillas, los emojis y los saltos de línea nunca se rompen.
- **IDs por nombre.** Los IDs de campos, columnas y opciones se buscan en cada ejecución, así que puedes renombrar columnas en el sitio web sin romper nada. Al renombrar una columna, sus tarjetas se quedan en ella.
- **Cada cambio se vuelve a leer.** Después de un cambio, el script imprime una línea `check:` con el estado real en GitHub (estado, columna, responsables, etiquetas). El agente informa a partir de ella.
- **Las imágenes** usan `--attach` de gh (GitHub user-attachments). Con un gh más antiguo, las imágenes se suben con un commit a una rama `gp-assets` del repositorio del issue y se enlazan.
- **Seguro por defecto.** Todo comando que hace cambios tiene `--dry-run`. Eliminar un issue, un tablero, un campo o una columna con tarjetas requiere `--yes`, y el skill le indica al agente que te pregunte primero. Las invitaciones (que envían un correo a una persona real) también se preguntan primero.
- **El tablero por defecto** se guarda en `~/.config/gp/config.json`; puedes cambiarlo con `--owner/--number` o `GP_OWNER`/`GP_PROJECT`.

Nota: justo después de crear un issue, la lista del proyecto en GitHub puede tardar unos segundos en mostrarlo. La línea `check:` lee el issue directamente y siempre está al día.

### Actualizar y quitar

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Otros agentes: vuelve a ejecutar la línea `curl … | tar` para actualizar; borra la carpeta `gp` para quitarlo.

### Estructura del repositorio

```
.claude-plugin/marketplace.json   ← el marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← el skill: cuándo usarlo y cómo
├─ .claude-plugin/plugin.json     ← información del plugin (solo Claude Code; otras herramientas lo ignoran)
├─ scripts/gp.py                  ← la herramienta
└─ references/                    ← se leen cuando hace falta
   ├─ github-projects.md          ← conceptos, cuenta, inicio de sesión, primer tablero
   └─ commands.md                 ← todos los comandos + recetas con gh / GraphQL directo
```

Aprende cómo funcionan los skills en el capítulo **Agent Skills** del curso de IA de SONUB: https://sonub.com/es/learn/ai#agent-skill

Licencia: [MIT](LICENSE)
