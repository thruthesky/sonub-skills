# sonub-skills — Agent Skills de SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · **Español** · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Este repositorio es un **marketplace de skills**. Cada skill es un [Agent Skill](https://agentskills.io) estándar (una carpeta con un `SKILL.md`), así que funciona en Claude Code, Codex, Gemini CLI, GitHub Copilot CLI y cualquier otro agente que lea Agent Skills. Claude Code también puede instalarlo como plugin desde este marketplace (`sonub-skills`), de modo que actualizarlo es un solo comando.

| Skill | Qué hace |
|------|------|
| [`gp`](skills/gp) | Gestiona todo tu trabajo en **GitHub Projects** con git y la CLI `gh` |
| [`claude-skill`](skills/claude-skill) | **Aprende Claude Code y úsalo cada vez mejor** — 14 lecciones con cuestionarios, respuestas comprobadas en la documentación oficial, un revisor de tu configuración, un resumen de cada novedad del CHANGELOG y `/claude-skill update` para incorporar las nuevas (nombre del plugin `cc-skill`) |
| [`popup`](skills/popup) | **Explica la jerga con popups al pasar el cursor** en las páginas y la documentación de cualquier proyecto — significado, palabras sencillas, ejemplos, código fuente, términos relacionados y enlaces de "saber más" a tus propias páginas, todo desde un único JSON de glosario |

## Instalación — global (usuario) o por proyecto

Todos los skills se instalan igual. Pon el nombre del plugin de la tabla (`gp`, `cc-skill`, `popup`) en lugar de `<plugin>`.

**Paso 1 — añade el marketplace (una vez por computadora)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Paso 2 — instálalo donde lo quieras**

| Alcance | Comando | Quién lo tiene y dónde | Se guarda en |
|------|------|------|------|
| **Global (usuario)** — por defecto | `claude plugin install <plugin>@sonub-skills` | tú, en todos los proyectos de esta computadora | `~/.claude/settings.json` |
| **Proyecto (compartido con el equipo)** | en la carpeta del proyecto: `claude plugin install <plugin>@sonub-skills --scope project` | todos los que trabajan en este repositorio | `.claude/settings.json` (haz commit de él) |
| **Local (solo tú, solo este proyecto)** | en la carpeta del proyecto: `claude plugin install <plugin>@sonub-skills --scope local` | tú, solo en este repositorio | `.claude/settings.local.json` |

- En un chat, `/plugin install <plugin>@sonub-skills` abre una pantalla donde eliges el alcance. Si instalaste desde una terminal, ejecuta `/reload-plugins` en un chat abierto.
- Comprobar: `claude plugin list` (muestra el alcance). Actualizar: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Quitar: `claude plugin uninstall <plugin>@sonub-skills`.
- Si el mismo plugin está configurado en varios alcances, local gana a proyecto y proyecto gana a global.

**Que tu equipo lo reciba automáticamente** — haz commit de esto en el `.claude/settings.json` del repositorio. Cuando un compañero confíe (trust) en la carpeta, Claude Code añadirá el marketplace e instalará los plugins.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Sin plugins — copia la carpeta** en la carpeta de skills de tu agente (`<skill>` = `gp`, `claude-skill` o `popup`).

| Herramienta | Global (usuario) | Proyecto |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<proyecto>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<proyecto>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # solo este proyecto: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Lo más fácil** — dile a tu agente *"instala el plugin cc-skill de thruthesky/sonub-skills de forma global"* (o *"solo para este proyecto"*) y ejecutará los comandos de arriba por ti.

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
   - Si te pedí "solo para este proyecto", ejecuta la última línea en la carpeta del proyecto añadiendo --scope project.
   - Si ya está instalado, ejecuta en su lugar: claude plugin update gp@sonub-skills
2. Cualquier otro agente: ponlo en la carpeta de skills DIR — todos los proyectos: ~/.agents/skills, solo este proyecto: <proyecto>/.agents/skills.
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

#### Instalación global e instalación local (del proyecto)

| | Global — todos los proyectos | Local — solo este proyecto |
|------|------|------|
| Plugin de Claude Code | `claude plugin install gp@sonub-skills` | en la carpeta del proyecto: `claude plugin install gp@sonub-skills --scope project` (se escribe en `.claude/settings.json` y se comparte con el equipo · solo tú: `--scope local`) |
| Claude Code, copiando la carpeta | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Tablero que se usa | `/gp init <URL del tablero> --global` → `~/.config/gp/config.json` | `/gp init <URL del tablero>` → `<proyecto>/.gp.json` |

Dónde se instala el skill y qué tablero usa se eligen por separado. Normalmente instalas el skill de forma global una vez y le das a cada proyecto su tablero con `/gp init <URL del tablero>`.

### Primera ejecución

Pídele a tu agente *"configura gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Ejecuta:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · sesión iniciada ✓ · permisos ✓ · tablero por defecto
gh auth login                                   # solo si no has iniciado sesión — escribe el código de un solo uso en el navegador
gh auth refresh -s project,repo                 # solo si falta un permiso
python3 scripts/gp.py projects                  # tus tableros
python3 scripts/gp.py init <URL del tablero>    # el tablero de este proyecto (.gp.json) · todos los proyectos: --global … o crea uno:
python3 scripts/gp.py project-create --title "Mi trabajo" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Elige el tablero — `/gp init`

Cada proyecto de desarrollo puede tener su propio tablero de GitHub Project. Dale a tu agente la dirección del tablero en la carpeta del proyecto, y el trabajo de ese proyecto irá a ese tablero.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Si lo instalaste como plugin de Claude Code: `/gp:gp init …`; Codex: `$gp init …`. También funciona decir "usa https://… como tablero de este proyecto".

- **Local (por defecto)** — dentro de un repositorio git se guarda en `<raíz del repositorio>/.gp.json` y solo se usa en ese proyecto (y sus subcarpetas). No contiene ningún secreto: haz commit de él para que tu equipo use el mismo tablero, o añádelo a `.gitignore` para que quede solo para ti.
- **Global** — `/gp init <URL> --global` (o "hazlo el tablero por defecto de todos los proyectos") → `~/.config/gp/config.json`, se usa en cualquier carpeta sin `.gp.json`.
- Sirve cualquier página del tablero (`/views/2`, tableros de usuario `/users/…`, tableros de organización `/orgs/…`). Antes de guardarlo se comprueba que el tablero existe y se puede leer.
- `/gp init` sin nada más muestra el tablero en uso y su archivo de configuración. Quitarlo: `gp.py init --unset` (global: `--unset --global`).
- `/gp init` también escribe una instrucción en `AGENTS.md`/`CLAUDE.md` de este proyecto y en tus globales `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md`: «usa siempre la skill gp para crear, editar, borrar, listar o buscar issues, tareas y TODO de GitHub Project». Con una URL, añade «trabaja en este tablero» con esa URL. Al repetirlo solo se actualiza esa parte; `--show` solo muestra, `--no-instructions` la omite y `--remove-instructions` la quita.
- Qué tablero se usa: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → el `.gp.json` del proyecto → la configuración global.

### Cómo usarlo — solo dilo

| Tú dices | El agente ejecuta |
|------|------|
| "Crea un issue: el botón de inicio de sesión no hace nada en iPhone. Pasos: reproducir, corregir, probar. Adjunta shot.png" | `create --repo app --title "…" --todo reproducir --todo corregir --todo probar --image shot.png` → columna Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → se guarda como el tablero de este proyecto (`.gp.json`) |
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
- **La configuración del tablero** se guarda por proyecto en `.gp.json` (local) y para todos los proyectos en `~/.config/gp/config.json` (global). `--owner/--number` o `GP_OWNER`/`GP_PROJECT` tienen prioridad sobre ambos.

Nota: justo después de crear un issue, la lista del proyecto en GitHub puede tardar unos segundos en mostrarlo. La línea `check:` lee el issue directamente y siempre está al día.

### Actualizar y quitar

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Otros agentes: vuelve a ejecutar la línea `curl … | tar` para actualizar; borra la carpeta `gp` para quitarlo.

## claude-skill — aprende Claude Code y úsalo cada vez mejor

Claude Code saca una versión nueva casi todos los días (más de 400 hasta ahora). Este skill te lo enseña paso a paso, responde a tus preguntas con la **documentación oficial actual** en lugar de la memoria, revisa tu configuración y guarda un resumen de cada novedad del CHANGELOG. Con un solo `/claude-skill update` las funciones recién publicadas pasan al skill.

### Qué cubre

- **Un curso de 14 lecciones** — desde la instalación y las primeras instrucciones hasta explorar → planificar → programar → hacer commit, la gestión del contexto, CLAUDE.md y la memoria, los modos de permisos, los checkpoints, los skills, los subagentes, los hooks, MCP, los plugins y marketplaces, la ejecución headless y GitHub Actions, y el trabajo largo sin supervisión con verificación. Cada lección tiene un **ejercicio en tu propio proyecto** y preguntas de repaso, y tu progreso se guarda.
- **Claude Academy, analizado** — los 64 tutoriales de Claude en [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) más los tutoriales y cursos de Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents), con lo que aprendes en el chat (Projects, memoria, conectores, skills, Research, elegir modelo y effort…) llevado a cómo se hace en Claude Code.
- **Respuestas comprobadas en la documentación** — ante "¿cómo funcionan los hooks?" o "¿qué es el alcance de un plugin?", busca y lee code.claude.com y responde con el comando, un ejemplo y el enlace a la documentación.
- **Cada novedad del CHANGELOG** — las 422 versiones de [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), sin las correcciones de errores, resumidas en 14 temas, además de las 30 funciones que vale la pena conocer y las últimas incorporaciones.
- **`/claude-skill update`** — descarga el CHANGELOG más reciente, encuentra las versiones que el skill aún no cubre, añade sus funciones a las notas, la chuleta y las lecciones, y anota hasta dónde ha llegado.
- **Revisor de configuración (doctor)** — mira tu versión, los archivos de configuración (usuario, proyecto, local), la longitud de CLAUDE.md, las reglas, la memoria automática, los skills, los subagentes, los plugins y los servidores MCP, y te sugiere arreglos.
- **Chuleta, consejos y guías para crear** — comandos, atajos, opciones de la CLI y ubicaciones de archivos en una sola página; hábitos que funcionan; cómo crear skills, subagentes, hooks, servidores MCP, plugins y marketplaces.

### Instalación

Igual que en [Instalación](#instalación--global-usuario-o-por-proyecto), más arriba. El plugin se llama **`cc-skill`** (Claude Code reserva los nombres de plugin que empiezan por `claude-` para los de Anthropic). El skill mantiene el nombre `claude-skill`, así que lo llamas con `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — todos los proyectos
claude plugin install cc-skill@sonub-skills --scope project    # este proyecto, compartido con el equipo
```

Necesita Python 3.8 o posterior y acceso a internet (lee la documentación oficial y el CHANGELOG).

### Cómo usarlo

| Tú dices | Lo que hace |
|------|------|
| `/claude-skill` · "vamos a estudiar Claude Code" | Muestra las lecciones y tu progreso, y empieza la siguiente |
| `/claude-skill lesson 5` · "siguiente lección" | La enseña, hace el ejercicio en tu proyecto, te hace preguntas de repaso y guarda el progreso |
| `/claude-skill quiz` | Cinco preguntas sobre lo que has estudiado, una a una, con puntuación |
| "¿Cómo ejecuto prettier después de cada edición con un hook?" | Lee la documentación oficial y responde con un ejemplo de configuración y el enlace |
| `/claude-skill new` · "¿qué hay de nuevo?" | Primero las novedades recientes más útiles, cada una con cómo probarla |
| `/claude-skill doctor` · "revisa mi configuración" | Revisa tu configuración y propone arreglos (pregunta antes de cambiar nada) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Hábitos que funcionan · comandos y atajos · el análisis de Academy |
| `/claude-skill build skill` · "hazme un hook" | Elige el mecanismo adecuado y lo construye contigo en tu proyecto |
| `/claude-skill update` | Actualiza las notas de funciones del skill con el CHANGELOG más reciente |

Si lo instalaste como plugin, también funciona `/cc-skill:claude-skill …`. Codex: `$claude-skill …`.

### Cómo funciona `/claude-skill update`

1. `scripts/cc.py update-check` compara la versión que cubren las notas (la marca `covered-through` en `references/changelog-features.md`) con la última versión del CHANGELOG.
2. En una copia instalada como plugin, primero ejecuta `claude plugin update cc-skill@sonub-skills` para obtener las notas publicadas. Para editar el código fuente del skill (un checkout de git), pasa `--source <carpeta>`. Sin código fuente, escribe en `~/.config/claude-skill/changelog-local.md`, que se conserva al actualizar el plugin.
3. `cc.py changelog --since <versión cubierta>` lista los cambios de las versiones nuevas (sin las correcciones); el agente añade las funciones nuevas a sus temas, reescribe "Últimas incorporaciones", añade los comandos y atajos nuevos a la chuleta y corrige las lecciones que han quedado desactualizadas.
4. `cc.py mark-covered <última versión>` mueve la marca; en un checkout de git sube la versión y hace commit (solo hace push si se lo pides).
5. Informa del rango cubierto y de 3–7 novedades que vale la pena probar, con cómo probar cada una.

### La herramienta — `scripts/cc.py`

Solo usa la biblioteca estándar de Python.

```bash
python3 scripts/cc.py doctor                 # revisa tu configuración de Claude Code + consejos
python3 scripts/cc.py docs hooks             # busca en la documentación oficial (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # lee una sección de una página
python3 scripts/cc.py changelog --count 5    # las 5 últimas versiones (sin correcciones)
python3 scripts/cc.py changelog --grep worktree --count 400   # busca una función por su nombre
python3 scripts/cc.py update-check           # versiones cubiertas vs. la última
python3 scripts/cc.py lessons                # lecciones y progreso
```

## popup — explica cada palabra difícil justo donde la encuentra el lector

Un lector se detiene en una sola palabra desconocida — "token", "endpoint", "idempotente" — y pierde todo el párrafo. Este skill pone una tarjeta pequeña sobre esa palabra: pasa el cursor por encima (en el móvil, tócala; con el teclado, dale el foco) y explica el término por capas — el significado en una línea, una explicación breve, una comparación cotidiana, líneas de ejemplo, un fragmento de código fuente, términos relacionados y un **enlace de "saber más" a otra página de tu propio proyecto**. Funciona en cualquier proyecto: sitios estáticos, generadores de documentación, aplicaciones de una sola página, sitios renderizados en el servidor y Markdown normal leído en GitHub.

### Qué cubre

- **Un glosario, un solo lugar** — todas las explicaciones viven en un archivo JSON (o uno por idioma); las páginas solo apuntan a ids de términos, así que la misma palabra se lee igual en todas partes.
- **Un kit para soltar y usar** — `popup.js` y `popup.css`, sin framework y sin paso de compilación. El texto normal dentro de `main`/`article` se envuelve automáticamente (la primera vez en cada página); para frases, oraciones, botones "?" y enlaces con vista previa al pasar el cursor se usa marcado explícito. Una tarjeta por página, se fija con un clic, los chips de términos relacionados cambian la tarjeta en el sitio, Esc devuelve el foco, hoja inferior en el móvil, idiomas de derecha a izquierda, modo oscuro y temas con variables CSS.
- **Coincidencias inteligentes** — primero la grafía más larga, límites de palabra según cada escritura (latina, cirílica, partículas del coreano, prefijos del árabe, CJK), términos que solo valen en una sección (`scope`), nombres de comandos que distinguen mayúsculas y minúsculas.
- **Reglas de redacción** — cómo escribir una tarjeta que un principiante entienda de una sola lectura, en cada idioma que publique el proyecto: para qué sirve cada campo, longitudes, una sola comparación, datos comprobados y ejemplos siempre que existan ejemplos reales.
- **Herramientas** — `popup.py check` valida el glosario (todos los idiomas, código de ejemplo idéntico en todos ellos, ids relacionados, que existan los destinos de "saber más", choques de grafía); `audit` muestra qué términos usa ya un documento y encuentra jerga que aún no tiene entrada; `add` fusiona términos nuevos sin riesgo; `md` + `link` convierten el glosario en `GLOSSARY.md` y enlazan el primer uso de cada término en tus archivos Markdown, con el significado como título al pasar el cursor.
- **SONUB** — dentro del repositorio de SONUB se apoya en el glosario de Laravel de SONUB (17 idiomas, la voz del tutor de IA) en lugar de añadir un segundo sistema.

### Instalación

Igual que en [Instalación](#instalación--global-usuario-o-por-proyecto), más arriba, con el nombre de plugin **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — todos los proyectos
claude plugin install popup@sonub-skills --scope project    # este proyecto, compartido con el equipo
```

La herramienta necesita Python 3.8 o posterior. El kit funciona en cualquier navegador moderno.

### Cómo usarlo

| Tú dices | Lo que hace |
|------|------|
| `/popup docs/getting-started.md` · "añade popups de glosario a esta página" | Encuentra las palabras difíciles, escribe las entradas, conecta el kit y lo comprueba en un navegador |
| `/popup token, sampling, temperature` | Escribe esas tres entradas y las pone donde se usan |
| "explica los elementos del menú al pasar el cursor" | Añade vistas previas al pasar el cursor en los enlaces, con botones "?" para el móvil y el teclado |
| "haz el README apto para principiantes" | Crea `GLOSSARY.md` y enlaza el primer uso de cada término, con el significado al pasar el cursor |
| "traduce el glosario al japonés" | Añade `ja` a cada entrada y comprueba que no falte nada |

Si lo instalaste como plugin, también funciona `/popup:popup …`. Codex: `$popup …`.

### La herramienta — `scripts/popup.py`

Solo usa la biblioteca estándar de Python.

```bash
python3 scripts/popup.py init popup --locales en,ko   # copia popup.js/css, crea glossary.json, escribe .popup.json
python3 scripts/popup.py audit docs                   # términos usados por archivo + jerga sin entrada
python3 scripts/popup.py add new-terms.json --dry-run # fusiona términos nuevos (con comprobación, nunca sobrescribe en silencio)
python3 scripts/popup.py check                        # valida el glosario
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown en GitHub
```

Después añade dos etiquetas a tu plantilla de diseño:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Estructura del repositorio

```
.claude-plugin/marketplace.json   ← el marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← el skill: cuándo usarlo y cómo
├─ .claude-plugin/plugin.json     ← información del plugin (solo Claude Code; otras herramientas lo ignoran)
├─ scripts/gp.py                  ← la herramienta
└─ references/                    ← se leen cuando hace falta
   ├─ github-projects.md          ← conceptos, cuenta, inicio de sesión, primer tablero
   └─ commands.md                 ← todos los comandos + recetas con gh / GraphQL directo
skills/claude-skill/
├─ SKILL.md                       ← el skill: cuándo usarlo y cómo
├─ .claude-plugin/plugin.json     ← información del plugin (nombre del plugin cc-skill)
├─ scripts/cc.py                  ← herramienta de estudio: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 lecciones · análisis de Academy · funciones del CHANGELOG · chuleta · guías para crear · consejos · cuestionario
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← el skill: cuándo usarlo y cómo
├─ .claude-plugin/plugin.json     ← información del plugin
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← herramientas solo de SONUB (glosario de Laravel)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Aprende cómo funcionan los skills en el capítulo **Agent Skills** del curso de IA de SONUB: https://sonub.com/es/learn/ai#agent-skill

Licencia: [MIT](LICENSE)
