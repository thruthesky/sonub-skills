# sonub-skills — навыки для агентов (Agent Skills) от SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Русский** · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Этот репозиторий — **маркетплейс навыков**. Каждый навык — это стандартный [Agent Skill](https://agentskills.io) (папка с файлом `SKILL.md`), поэтому он работает в Claude Code, Codex, Gemini CLI, GitHub Copilot CLI и в любом другом агенте, который читает Agent Skills. В Claude Code его также можно установить как плагин из этого маркетплейса (`sonub-skills`), и тогда обновление выполняется одной командой.

| Навык | Что делает |
|------|------|
| [`gp`](skills/gp) | Управляйте всей своей работой в **GitHub Projects** с помощью git и `gh` CLI |

---

## gp — вся ваша работа на доске GitHub Project

Вы говорите со своим ИИ-агентом обычными словами — *«создай issue: на iPhone кнопка входа ничего не делает, приложи этот скриншот»*, *«перенеси в Done»*, *«добавь колонку Review»*, *«что у меня в работе?»* — а агент выполняет это на вашей доске GitHub Project через `gh` и затем перечитывает результат, чтобы подтвердить.

### Что охватывает

- **Объяснение GitHub Projects** — репозиторий, issue, проект (доска), элемент (item), черновик (draft), поле, Status = колонки, представление (view), workflow. Агент может объяснить всё это на вашем языке.
- **Аккаунт и вход** — шаги регистрации нового аккаунта GitHub, установка `gh`, `gh auth login`, права (scopes) `project` и `repo`.
- **Доски** — создать, переименовать, добавить описание, сделать публичной/приватной, закрыть/открыть снова, удалить, привязать репозитории, показать список своих досок, выбрать доску по умолчанию.
- **Колонки (канбан)** — добавить, переименовать (карточки остаются на месте), изменить порядок, задать цвет, удалить (сначала перенесите карточки в другую колонку).
- **Поля и представления** — пользовательские поля (текст, число, дата, одиночный выбор), представления «доска», «таблица» и «дорожная карта» с фильтрами.
- **Issues** — создать (сразу в нужную колонку, с метками, вехой (milestone), родительским issue, пользовательскими полями), изменить, перенести между колонками, закрыть (переходит в Done), открыть снова, прокомментировать, убрать с доски, архивировать, удалить.
- **Изображения** — прикрепить скриншоты или видео к тексту issue или к комментарию.
- **TODO** — чек-лист `- [ ]` внутри issue: добавить, отметить, снять отметку, удалить; прогресс виден в списках. Черновики (draft) для быстрых идей, которые потом можно превратить в issues.
- **Люди** — назначить и снять исполнителя, посмотреть, кто чем занят, пригласить соавторов в репозиторий и выдать роли на доске.

### Что нужно

- Аккаунт GitHub (бесплатный). Ещё нет аккаунта? Зарегистрируйтесь на https://github.com/signup — код из письма, головоломка, тариф Free (около трёх минут).
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), вход выполнен с правами `project` и `repo`.
- Python 3.8 или новее (только стандартная библиотека).

### Установка

**Проще всего — поручить это агенту.** Скопируйте этот блок в Claude Code, Codex, Gemini CLI или Copilot CLI и отправьте:

```text
Установи навык gp из репозитория thruthesky/sonub-skills.
Путь к навыку: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — стандартный Agent Skill (папка с SKILL.md).

1. Если ты Claude Code, установи его как плагин, выполнив эти команды по порядку (ошибки «already added» игнорируй):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Если я просил установить «только для этого проекта», выполни последнюю строку в папке проекта, добавив --scope project.
   - Если он уже установлен, вместо этого выполни: claude plugin update gp@sonub-skills
2. Любой другой агент: помести его в папку навыков DIR — для всех проектов: ~/.agents/skills, только для этого проекта: <проект>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Выполни: python3 <папка навыка>/scripts/gp.py doctor — и исправь то, о чём он сообщит (установить gh, gh auth login, gh auth refresh -s project,repo).
4. Кратко сообщи мне, что установлено, каков результат doctor и что теперь я могу говорить, например, «покажи мои проекты GitHub».
```

**Claude Code — две строки в терминале** (работает в любой версии):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

В чате введите `/plugin marketplace add thruthesky/sonub-skills`, а затем `/plugin install gp@sonub-skills`. Новые версии понимают и одну строку: `claude plugin install gp --marketplace thruthesky/sonub-skills`. После установки из терминала выполните `/reload-plugins` в открытом чате (или перезапустите его).

**Любой агент — скопируйте папку** в папку навыков агента:

| Инструмент | Пользовательская папка навыков | Папка навыков проекта |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### Глобальная и локальная (для проекта) установка

| | Глобально — все проекты | Локально — только этот проект |
|------|------|------|
| Плагин Claude Code | `claude plugin install gp@sonub-skills` | в папке проекта: `claude plugin install gp@sonub-skills --scope project` (записывается в `.claude/settings.json` и общий для всей команды · только для вас: `--scope local`) |
| Копия папки для Claude Code | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Используемая доска | `/gp init <URL доски> --global` → `~/.config/gp/config.json` | `/gp init <URL доски>` → `<проект>/.gp.json` |

Где установлен навык и какую доску он использует, выбирается отдельно. Обычно навык устанавливают глобально один раз, а каждому проекту задают его доску через `/gp init <URL доски>`.

### Первый запуск

Попросите агента *«настрой gp»* (Claude Code: `/gp:gp`, Codex: `$gp`). Он выполнит:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · вход ✓ · права ✓ · доска по умолчанию
gh auth login                                   # только если вход не выполнен — введите одноразовый код в браузере
gh auth refresh -s project,repo                 # только если не хватает прав
python3 scripts/gp.py projects                  # ваши доски
python3 scripts/gp.py init <URL доски>          # доска этого проекта (.gp.json) · для всех проектов: --global … или создайте новую:
python3 scripts/gp.py project-create --title "Моя работа" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Выбор доски — `/gp init`

У каждого проекта разработки может быть своя доска GitHub Project. Дайте агенту адрес доски в папке проекта — и работа этого проекта будет вестись на этой доске.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Если навык установлен как плагин Claude Code: `/gp:gp init …`; в Codex: `$gp init …`. Можно сказать и так: «используй https://… как доску этого проекта».

- **Локально (по умолчанию)** — внутри git-репозитория настройка сохраняется в `<корень репозитория>/.gp.json` и используется только в этом проекте (и его подпапках). Секретов в файле нет: закоммитьте его, чтобы команда работала с той же доской, или добавьте в `.gitignore`, чтобы оставить только себе.
- **Глобально** — `/gp init <URL> --global` (или «сделай её доской по умолчанию для всех проектов») → `~/.config/gp/config.json`, используется в любой папке без `.gp.json`.
- Подходит любая страница доски (`/views/2`, доски пользователя `/users/…`, доски организации `/orgs/…`). Перед сохранением проверяется, что доска существует и доступна для чтения.
- `/gp init` без аргументов показывает текущую доску и её файл настроек. Удалить: `gp.py init --unset` (глобально: `--unset --global`).
- Какая доска используется: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → `.gp.json` проекта → глобальная настройка.

### Как пользоваться — просто скажите

| Вы говорите | Агент выполняет |
|------|------|
| «Создай issue: на iPhone кнопка входа ничего не делает. Шаги: воспроизвести, исправить, протестировать. Приложи shot.png» | `create --repo app --title "…" --todo воспроизвести --todo исправить --todo протестировать --image shot.png` → колонка Todo |
| «/gp init https://github.com/orgs/my-team/projects/3» | `init …` → сохраняется как доска этого проекта (`.gp.json`) |
| «Возьми в работу» · «Перенеси #12 в Review» | `move app#12 doing` · `move app#12 review` |
| «Готово!» | `close app#12` — закрывает issue и переносит его в Done |
| «Добавь в его TODO „обновить документацию“» · «отметь первый пункт» | `todo app#12 add "обновить документацию"` · `todo app#12 done 1` |
| «Добавь колонку Urgent в начало» · «Переименуй Review в QA» | `column-add Urgent --first --color red` · `column-rename Review QA` |
| «Передай это alice» · «Пригласи bob в репозиторий» | `assign app#12 alice` · `invite bob --repo app` (сначала спрашивает) |
| «Что у меня в работе?» | `list --assignee @me --state open`, затем предлагает одну следующую задачу |
| «Запиши идею на доску: тёмная тема» | `create --draft --title "тёмная тема"` |
| «Добавь поле Priority» | `field-add Priority --type single_select --options "High,Medium,Low"` |

Все команды: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Как это работает

- **Только `gh` и стандартная библиотека Python.** gh вызывается со списком аргументов (без оболочки), а заголовки и тексты передаются через stdin — кавычки, эмодзи и переводы строк никогда не ломаются.
- **ID по имени.** ID полей, колонок и вариантов ищутся при каждом запуске, поэтому колонки можно переименовывать на сайте, ничего не ломая. При переименовании колонки её карточки остаются на месте.
- **Каждое изменение перечитывается.** После изменения скрипт выводит строку `check:` с реальным состоянием на GitHub (состояние, колонка, исполнители, метки). Агент отчитывается по ней.
- **Изображения** загружаются через `--attach` в gh (GitHub user-attachments). Со старой версией gh изображения коммитятся в ветку `gp-assets` репозитория issue, и на них ставится ссылка.
- **Безопасно по умолчанию.** У каждой изменяющей команды есть `--dry-run`. Удаление issue, доски, поля или колонки с карточками требует `--yes`, а навык велит агенту сначала спросить вас. Перед приглашениями (они отправляют письмо реальному человеку) агент тоже сначала спрашивает.
- **Настройка доски** сохраняется для каждого проекта в `.gp.json` (локально) и для всех проектов в `~/.config/gp/config.json` (глобально). `--owner/--number` или `GP_OWNER`/`GP_PROJECT` имеют приоритет над обеими.

Примечание: сразу после создания issue список проекта на GitHub может показать его только через несколько секунд. Строка `check:` читает issue напрямую и всегда актуальна.

### Обновление и удаление

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Другие агенты: чтобы обновить, снова выполните строку `curl … | tar`; чтобы удалить, удалите папку `gp`.

### Структура репозитория

```
.claude-plugin/marketplace.json   ← маркетплейс (Claude Code)
skills/gp/
├─ SKILL.md                       ← сам навык: когда и как его использовать
├─ .claude-plugin/plugin.json     ← сведения о плагине (только для Claude Code; другие инструменты их игнорируют)
├─ scripts/gp.py                  ← инструмент
└─ references/                    ← читать при необходимости
   ├─ github-projects.md          ← понятия, аккаунт, вход, первая доска
   └─ commands.md                 ← все команды + рецепты на чистом gh / GraphQL
```

Узнайте, как работают навыки, в главе **Agent Skills** курса SONUB по ИИ: https://sonub.com/ru/learn/ai#agent-skill

Лицензия: [MIT](LICENSE)
