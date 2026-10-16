# sonub-skills — Agent Skills da SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · **Português** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Este repositório é um **marketplace de skills**. Cada skill é uma [Agent Skill](https://agentskills.io) padrão — uma pasta com um `SKILL.md` —, por isso funciona no Claude Code, Codex, Gemini CLI, GitHub Copilot CLI e em qualquer outro agente que leia Agent Skills. O Claude Code também pode instalá-la como plugin a partir deste marketplace (`sonub-skills`), o que permite atualizá-la com um único comando.

| Skill | O que faz |
|------|------|
| [`gp`](skills/gp) | Gerencie todo o seu trabalho no **GitHub Projects** com git e a CLI `gh` |

---

## gp — todo o seu trabalho num quadro do GitHub Project

Você fala com o seu agente de IA em linguagem do dia a dia — *"crie uma issue: o botão de login não faz nada no iPhone, anexe esta captura de tela"*, *"mova para Done"*, *"adicione uma coluna Review"*, *"o que tenho para fazer?"* — e o agente faz isso no seu quadro do GitHub Project com o `gh` e depois lê o resultado de volta para confirmar.

### O que abrange

- **GitHub Projects explicado** — repositório, issue, projeto (quadro), item, rascunho, campo, Status = colunas, visualização, workflow. O seu agente pode ensinar tudo isso no seu idioma.
- **Conta e login** — passos para criar uma nova conta no GitHub, instalação do `gh`, `gh auth login`, os escopos `project` e `repo`.
- **Quadros** — criar, renomear, descrever, tornar público/privado, fechar/reabrir, excluir, vincular repositórios, listar os seus quadros, escolher um quadro padrão.
- **Colunas (kanban)** — adicionar, renomear (os cartões permanecem), reordenar, colorir, excluir (mova os cartões para outro lugar antes).
- **Campos e visualizações** — campos personalizados (texto, número, data, seleção única), visualizações de quadro/tabela/roteiro com filtros.
- **Issues** — criar (numa coluna, com labels, milestone, issue pai, campos personalizados), editar, mover entre colunas, fechar (vai para Done), reabrir, comentar, remover do quadro, arquivar, excluir.
- **Imagens** — anexar capturas de tela ou vídeos ao corpo de uma issue ou a um comentário.
- **TODO** — uma checklist `- [ ]` dentro de uma issue: adicionar, marcar, desmarcar, remover; o progresso aparece nas listas. Itens de rascunho para ideias rápidas, convertidos em issues depois.
- **Pessoas** — atribuir e remover responsáveis, ver quem está com o quê, convidar colaboradores para um repositório e dar papéis no quadro.

### Requisitos

- Uma conta no GitHub (gratuita). Ainda não tem? Cadastre-se em https://github.com/signup — código por e-mail, quebra-cabeça, plano Free (cerca de três minutos).
- [`gh`](https://cli.github.com) — a CLI do GitHub (macOS `brew install gh`, Windows `winget install GitHub.cli`), com login feito usando os escopos `project` e `repo`.
- Python 3.8 ou mais recente (apenas a biblioteca padrão).

### Instalação

**O mais fácil — deixe o seu agente fazer.** Copie esta caixa no Claude Code, Codex, Gemini CLI ou Copilot CLI e envie:

```text
Instale a skill gp do repositório thruthesky/sonub-skills.
Caminho da skill: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — uma Agent Skill padrão (uma pasta com SKILL.md).

1. Se você é o Claude Code, instale-a como plugin, executando estes comandos em ordem (ignore erros de "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Se já estiver instalada, execute em vez disso: claude plugin update gp@sonub-skills
2. Qualquer outro agente: coloque-a na sua pasta de skills do usuário DIR (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills).
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Execute: python3 <pasta da skill>/scripts/gp.py doctor — e corrija o que ele apontar (instalar gh, gh auth login, gh auth refresh -s project,repo).
4. Diga-me em poucas palavras o que foi instalado, o resultado do doctor e que agora posso dizer coisas como "mostre os meus projetos do GitHub".
```

**Claude Code — duas linhas num terminal** (funciona em todas as versões):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

Num chat, use `/plugin marketplace add thruthesky/sonub-skills` e depois `/plugin install gp@sonub-skills`. As versões mais recentes também aceitam uma única linha: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Depois de instalar a partir de um terminal, execute `/reload-plugins` num chat aberto (ou reinicie).

**Qualquer agente — copie a pasta** para a pasta de skills do agente:

| Ferramenta | Pasta de skills do usuário | Pasta de skills do projeto |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### Primeira execução

Peça ao seu agente *"configure o gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Ele executa:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · login feito ✓ · escopos ✓ · quadro padrão
gh auth login                                   # só se não houver login — digite o código de uso único no navegador
gh auth refresh -s project,repo                 # só se faltar um escopo
python3 scripts/gp.py projects                  # os seus quadros
python3 scripts/gp.py use <owner> <number>      # escolha um … ou crie um:
python3 scripts/gp.py project-create --title "Meu trabalho" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Como usar — é só dizer

| Você diz | O agente executa |
|------|------|
| "Crie uma issue: o botão de login não faz nada no iPhone. Passos: reproduzir, corrigir, testar. Anexe shot.png" | `create --repo app --title "…" --todo reproduzir --todo corrigir --todo testar --image shot.png` → coluna Todo |
| "Coloque em andamento" · "Mova a #12 para Review" | `move app#12 doing` · `move app#12 review` |
| "Pronto!" | `close app#12` — fecha a issue e a move para Done |
| "Adicione 'atualizar a documentação' ao TODO dela" · "marque o primeiro" | `todo app#12 add "atualizar a documentação"` · `todo app#12 done 1` |
| "Adicione uma coluna Urgent no início" · "Renomeie Review para QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "Passe para a alice" · "Convide o bob para o repositório" | `assign app#12 alice` · `invite bob --repo app` (pergunta antes) |
| "O que tenho para fazer?" | `list --assignee @me --state open` e depois sugere uma próxima tarefa |
| "Anote uma ideia no quadro: modo escuro" | `create --draft --title "modo escuro"` |
| "Adicione um campo Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

Todos os comandos: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Como funciona

- **Apenas o `gh` e a biblioteca padrão do Python.** O gh é chamado com uma lista de argumentos (sem shell), e títulos e corpos passam pelo stdin — aspas, emojis e quebras de linha nunca causam problemas.
- **IDs pelo nome.** Os IDs de campos, colunas e opções são buscados a cada execução, então você pode renomear colunas no site sem quebrar nada. Renomear uma coluna mantém os seus cartões.
- **Toda alteração é lida de volta.** Após uma alteração, o script imprime uma linha `check:` com o estado real no GitHub (estado, coluna, responsáveis, labels). O agente faz o relatório a partir dela.
- **Imagens** usam o `--attach` do gh (GitHub user-attachments). Com um gh mais antigo, as imagens são enviadas por commit para uma branch `gp-assets` do repositório da issue e vinculadas.
- **Seguro por padrão.** Todo comando que altera algo tem `--dry-run`. Excluir uma issue, um quadro, um campo ou uma coluna com cartões exige `--yes`, e a skill instrui o agente a perguntar a você antes. Convites (que enviam e-mail a uma pessoa real) também são perguntados antes.
- **O quadro padrão** fica salvo em `~/.config/gp/config.json`; substitua com `--owner/--number` ou `GP_OWNER`/`GP_PROJECT`.

Observação: logo depois de criar uma issue, a lista do projeto no GitHub pode levar alguns segundos para mostrá-la. A linha `check:` lê a issue diretamente e está sempre atualizada.

### Atualizar e remover

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Outros agentes: execute de novo a linha `curl … | tar` para atualizar; apague a pasta `gp` para remover.

### Estrutura do repositório

```
.claude-plugin/marketplace.json   ← o marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← a skill: quando e como usá-la
├─ .claude-plugin/plugin.json     ← informações do plugin (só Claude Code; outras ferramentas ignoram)
├─ scripts/gp.py                  ← a ferramenta
└─ references/                    ← leia quando precisar
   ├─ github-projects.md          ← conceitos, conta, login, primeiro quadro
   └─ commands.md                 ← todos os comandos + receitas com gh / GraphQL
```

Aprenda como as skills funcionam no capítulo **Agent Skills** do curso de IA da SONUB: https://sonub.com/pt/learn/ai#agent-skill

Licença: [MIT](LICENSE)
