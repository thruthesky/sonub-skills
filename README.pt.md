# sonub-skills — Agent Skills da SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · **Português** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Este repositório é um **marketplace de skills**. Cada skill é uma [Agent Skill](https://agentskills.io) padrão — uma pasta com um `SKILL.md` —, por isso funciona no Claude Code, Codex, Gemini CLI, GitHub Copilot CLI e em qualquer outro agente que leia Agent Skills. O Claude Code também pode instalá-la como plugin a partir deste marketplace (`sonub-skills`), o que permite atualizá-la com um único comando.

| Skill | O que faz |
|------|------|
| [`gp`](skills/gp) | Gerencie todo o seu trabalho no **GitHub Projects** com git e a CLI `gh` |
| [`claude-skill`](skills/claude-skill) | **Aprenda o Claude Code e use-o cada vez melhor** — 14 lições com quizzes, respostas conferidas na documentação oficial, um diagnóstico da sua configuração, um resumo de cada recurso novo do CHANGELOG e `/claude-skill update` para trazer os próximos (nome do plugin `cc-skill`) |
| [`popup`](skills/popup) | **Explique o jargão com popups ao passar o mouse** nas páginas e na documentação de qualquer projeto — significado, palavras simples, exemplos, código-fonte, termos relacionados e links “saiba mais” para as suas próprias páginas, a partir de um único JSON de glossário |

## Instalação — global (usuário) ou por projeto

Todas as skills se instalam do mesmo jeito. Troque `<plugin>` pelo nome do plugin da tabela (`gp`, `cc-skill`, `popup`).

**Passo 1 — adicione o marketplace (uma vez por computador)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Passo 2 — instale onde quiser**

| Escopo | Comando | Quem recebe, e onde | Gravado em |
|------|------|------|------|
| **Global (usuário)** — o padrão | `claude plugin install <plugin>@sonub-skills` | você, em todos os projetos deste computador | `~/.claude/settings.json` |
| **Projeto (compartilhado com a equipe)** | na pasta do projeto: `claude plugin install <plugin>@sonub-skills --scope project` | todos que trabalham neste repositório | `.claude/settings.json` (faça commit dele) |
| **Local (só você, só este projeto)** | na pasta do projeto: `claude plugin install <plugin>@sonub-skills --scope local` | você, só neste repositório | `.claude/settings.local.json` |

- Numa sessão, `/plugin install <plugin>@sonub-skills` abre uma tela onde você escolhe o escopo. Se você instalou pelo terminal, execute `/reload-plugins` em qualquer sessão aberta.
- Verificar: `claude plugin list` (mostra o escopo). Atualizar: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Remover: `claude plugin uninstall <plugin>@sonub-skills`.
- Quando o mesmo plugin está definido em vários escopos, o local vence o do projeto, e o do projeto vence o global.

**Deixe a equipe recebê-lo automaticamente** — faça commit disto no `.claude/settings.json` do repositório. Depois que um colega confiar na pasta, o Claude Code adiciona o marketplace e instala os plugins.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Sem plugins — copie a pasta** para a pasta de skills do seu agente (`<skill>` = `gp`, `claude-skill` ou `popup`).

| Ferramenta | Global (usuário) | Projeto |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<projeto>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<projeto>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # só este projeto: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**O mais fácil** — diga ao seu agente *"instale o plugin cc-skill de thruthesky/sonub-skills globalmente"* (ou *"só para este projeto"*) e ele executa os comandos acima por você.

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
   - Se eu pedi "só para este projeto", execute a última linha na pasta do projeto acrescentando --scope project.
   - Se já estiver instalada, execute em vez disso: claude plugin update gp@sonub-skills
2. Qualquer outro agente: coloque-a na pasta de skills DIR — todos os projetos: ~/.agents/skills, só este projeto: <projeto>/.agents/skills.
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

#### Instalação global e instalação local (do projeto)

| | Global — todos os projetos | Local — só este projeto |
|------|------|------|
| Plugin do Claude Code | `claude plugin install gp@sonub-skills` | na pasta do projeto: `claude plugin install gp@sonub-skills --scope project` (gravado em `.claude/settings.json` e compartilhado com a equipe · só você: `--scope local`) |
| Claude Code, cópia da pasta | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Quadro usado | `/gp init <URL do quadro> --global` → `~/.config/gp/config.json` | `/gp init <URL do quadro>` → `<projeto>/.gp.json` |

Onde a skill é instalada e qual quadro ela usa são escolhidos separadamente. Normalmente você instala a skill globalmente uma vez e define o quadro de cada projeto com `/gp init <URL do quadro>`.

### Primeira execução

Peça ao seu agente *"configure o gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Ele executa:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · login feito ✓ · escopos ✓ · quadro padrão
gh auth login                                   # só se não houver login — digite o código de uso único no navegador
gh auth refresh -s project,repo                 # só se faltar um escopo
python3 scripts/gp.py projects                  # os seus quadros
python3 scripts/gp.py init <URL do quadro>      # o quadro deste projeto (.gp.json) · todos os projetos: --global … ou crie um:
python3 scripts/gp.py project-create --title "Meu trabalho" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Escolha o quadro — `/gp init`

Cada projeto de desenvolvimento pode ter o seu próprio quadro do GitHub Project. Passe ao seu agente o endereço do quadro na pasta do projeto, e o trabalho desse projeto vai para esse quadro.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Instalada como plugin do Claude Code: `/gp:gp init …`; Codex: `$gp init …`. Dizer "use https://… como o quadro deste projeto" também funciona.

- **Local (padrão)** — dentro de um repositório git, fica salvo em `<raiz do repositório>/.gp.json` e é usado só nesse projeto (e nas suas subpastas). Não contém nenhum segredo: faça commit dele para que a equipe use o mesmo quadro, ou adicione-o ao `.gitignore` para mantê-lo só para você.
- **Global** — `/gp init <URL> --global` (ou "torne-o o quadro padrão de todos os projetos") → `~/.config/gp/config.json`, usado em qualquer pasta sem `.gp.json`.
- Qualquer página do quadro serve (`/views/2`, quadros de usuário `/users/…`, quadros de organização `/orgs/…`). Antes de salvar, verifica-se que o quadro existe e pode ser lido.
- `/gp init` sozinho mostra o quadro em uso e o seu arquivo de configuração. Remover: `gp.py init --unset` (global: `--unset --global`).
- `/gp init` também escreve uma instrução no `AGENTS.md`/`CLAUDE.md` deste projeto e nos seus globais `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md`: “use sempre a skill gp para criar, editar, excluir, listar ou buscar issues, tarefas e TODOs do GitHub Project”. Com uma URL, acrescenta “trabalhe neste quadro” com essa URL. Rodar de novo atualiza só essa parte; `--show` só mostra, `--no-instructions` pula a instrução, `--remove-instructions` a remove.
- Qual quadro é usado: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → o `.gp.json` do projeto → a configuração global.

### Como usar — é só dizer

| Você diz | O agente executa |
|------|------|
| "Crie uma issue: o botão de login não faz nada no iPhone. Passos: reproduzir, corrigir, testar. Anexe shot.png" | `create --repo app --title "…" --todo reproduzir --todo corrigir --todo testar --image shot.png` → coluna Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → salvo como o quadro deste projeto (`.gp.json`) |
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
- **A configuração do quadro** fica salva por projeto em `.gp.json` (local) e para todos os projetos em `~/.config/gp/config.json` (global). `--owner/--number` ou `GP_OWNER`/`GP_PROJECT` têm prioridade sobre ambos.

Observação: logo depois de criar uma issue, a lista do projeto no GitHub pode levar alguns segundos para mostrá-la. A linha `check:` lê a issue diretamente e está sempre atualizada.

### Atualizar e remover

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Outros agentes: execute de novo a linha `curl … | tar` para atualizar; apague a pasta `gp` para remover.

## claude-skill — aprenda o Claude Code e use-o cada vez melhor

O Claude Code lança uma versão nova quase todo dia (mais de 400 até agora). Esta skill ensina tudo em ordem, responde às perguntas com base na **documentação oficial atual** em vez da memória, verifica a sua configuração e mantém um resumo de cada recurso novo do CHANGELOG. Um único `/claude-skill update` traz para a skill os recursos recém-lançados.

### O que abrange

- **Uma trilha de estudo com 14 lições** — da instalação e dos primeiros prompts até explorar → planejar → programar → fazer commit, gestão de contexto, CLAUDE.md e memória, modos de permissão, checkpoints, skills, subagentes, hooks, MCP, plugins e marketplaces, execuções headless e GitHub Actions, e trabalhos longos sem supervisão com verificação. Cada lição tem um **exercício no seu próprio projeto** e perguntas de revisão, e o seu progresso fica salvo.
- **A Claude Academy, analisada** — os 64 tutoriais do Claude na [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat), mais os tutoriais e cursos de Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents), com o que você aprende no chat (Projects, memória, conectores, skills, Research, escolha de modelo e de esforço…) ligado ao jeito de fazer o mesmo no Claude Code.
- **Respostas conferidas na documentação** — para "como funcionam os hooks?" ou "o que é o escopo de um plugin?", ela pesquisa e lê o code.claude.com e responde com o comando, um exemplo e o link da documentação.
- **Cada recurso novo do CHANGELOG** — todas as 422 versões do [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), sem as correções de bugs, resumidas em 14 temas, mais os 30 recursos que vale a pena conhecer e as novidades mais recentes.
- **`/claude-skill update`** — busca o CHANGELOG mais recente, encontra as versões que a skill ainda não cobre, acrescenta os recursos delas às notas, à folha de consulta e às lições, e registra até onde já cobriu.
- **Diagnóstico da configuração** — confere a sua versão, os arquivos de configuração (usuário, projeto, local), o tamanho do CLAUDE.md, as regras, a memória automática, as skills, os subagentes, os plugins e os servidores MCP, e sugere correções.
- **Folha de consulta, dicas e guias de criação** — comandos, atalhos, flags da CLI e locais dos arquivos numa só página; hábitos que funcionam; como criar skills, subagentes, hooks, servidores MCP, plugins e marketplaces.

### Instalação

Como em [Instalação](#instalação--global-usuário-ou-por-projeto) acima. O plugin se chama **`cc-skill`** (o Claude Code reserva os nomes de plugin que começam com `claude-` para os da própria Anthropic). A skill mantém o nome `claude-skill`, então você a chama com `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — todos os projetos
claude plugin install cc-skill@sonub-skills --scope project    # este projeto, compartilhado com a equipe
```

Precisa de Python 3.8+ e acesso à internet (ela lê a documentação oficial e o CHANGELOG).

### Como usar

| Você diz | Ela faz |
|------|------|
| `/claude-skill` · "vamos estudar Claude Code" | Mostra as lições e o seu progresso e começa a próxima |
| `/claude-skill lesson 5` · "próxima lição" | Dá a lição, faz o exercício no seu projeto, faz perguntas de revisão e salva o progresso |
| `/claude-skill quiz` | Cinco perguntas sobre o que você estudou, uma de cada vez, com nota |
| "Como faço para rodar o prettier depois de cada edição com um hook?" | Lê a documentação oficial e responde com um exemplo de configuração e o link |
| `/claude-skill new` · "o que há de novo?" | Os recursos recentes mais úteis primeiro, cada um com o jeito de experimentar |
| `/claude-skill doctor` · "verifique a minha configuração" | Revisa a sua configuração e propõe correções (pergunta antes de mudar qualquer coisa) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Hábitos que funcionam · comandos e atalhos · a análise da Academy |
| `/claude-skill build skill` · "crie um hook para mim" | Escolhe o mecanismo certo e o constrói com você no seu projeto |
| `/claude-skill update` | Atualiza as notas de recursos da skill a partir do CHANGELOG mais recente |

Instalada como plugin, `/cc-skill:claude-skill …` também funciona. Codex: `$claude-skill …`.

### Como funciona o `/claude-skill update`

1. `scripts/cc.py update-check` compara a versão que as notas cobrem (a marca `covered-through` em `references/changelog-features.md`) com a versão mais recente do CHANGELOG.
2. Numa cópia instalada como plugin, primeiro executa `claude plugin update cc-skill@sonub-skills` para obter as notas publicadas. Para editar o código-fonte da skill (um checkout do git), passe `--source <pasta>`. Sem código-fonte, ela grava em `~/.config/claude-skill/changelog-local.md`, que continua lá depois das atualizações do plugin.
3. `cc.py changelog --since <versão coberta>` lista os itens das versões novas (correções ocultas); o agente acrescenta os recursos novos aos seus temas, reescreve as "novidades mais recentes", adiciona os novos comandos e atalhos à folha de consulta e corrige as lições que ficaram erradas.
4. `cc.py mark-covered <última versão>` move a marca; num checkout do git, aumenta o número da versão e faz commit (só faz push se você pedir).
5. Informa o intervalo coberto e de 3 a 7 recursos novos que vale a pena experimentar, com o jeito de experimentar cada um.

### A ferramenta — `scripts/cc.py`

Só a biblioteca padrão do Python.

```bash
python3 scripts/cc.py doctor                 # verifica a sua configuração do Claude Code + conselhos
python3 scripts/cc.py docs hooks             # pesquisa a documentação oficial (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # lê uma seção de uma página
python3 scripts/cc.py changelog --count 5    # as 5 versões mais recentes (correções ocultas)
python3 scripts/cc.py changelog --grep worktree --count 400   # encontra um recurso pelo nome
python3 scripts/cc.py update-check           # versões cobertas vs. a mais recente
python3 scripts/cc.py lessons                # lições e progresso
```

## popup — explique cada palavra difícil onde o leitor a encontra

Um leitor para numa palavra desconhecida — “token”, “endpoint”, “idempotente” — e perde o parágrafo inteiro. Esta skill coloca um pequeno cartão nessa palavra: passe o mouse sobre ela (toque no celular, foco pelo teclado) e ele explica o termo em camadas — significado numa linha, uma explicação curta, uma comparação do dia a dia, linhas de exemplo, um trecho de código-fonte, termos relacionados e um **link “saiba mais” para outra página do seu próprio projeto**. Funciona em qualquer projeto: sites estáticos, geradores de documentação, aplicações de página única, sites renderizados no servidor e Markdown simples lido no GitHub.

### O que abrange

- **Um glossário, um só lugar** — toda explicação fica num único arquivo JSON (ou um por idioma); as páginas apontam apenas para ids de termos, então a mesma palavra é lida igual em todo lugar.
- **Um kit pronto para usar** — `popup.js` e `popup.css`, sem framework e sem etapa de build. O texto simples dentro de `main`/`article` é envolvido automaticamente (no primeiro uso por página); há marcação explícita para expressões, frases, botões "?" e links que mostram uma prévia ao passar o mouse. Um cartão por página, fixado com um clique, os chips relacionados trocam o conteúdo no lugar, Esc devolve o foco, painel inferior (bottom sheet) no celular, idiomas da direita para a esquerda, modo escuro e temas com variáveis CSS.
- **Correspondência inteligente** — a grafia mais longa primeiro, limites de palavra para cada escrita (latina, cirílica, partículas do coreano, prefixos do árabe, CJK), termos que só valem numa seção (`scope`) e nomes de comandos que diferenciam maiúsculas de minúsculas.
- **Regras de escrita** — como escrever um cartão que um iniciante entende numa só leitura, em todos os idiomas que o projeto entrega: para que serve cada campo, tamanhos, uma comparação, fatos conferidos e exemplos sempre que existirem exemplos reais.
- **Ferramentas** — `popup.py check` valida o glossário (todos os locales, código de exemplo idêntico entre os idiomas, ids relacionados, existência dos destinos de “saiba mais”, conflitos de grafia); `audit` mostra quais termos um documento já usa e encontra jargão que ainda não tem entrada; `add` mescla termos novos com segurança; `md` + `link` transformam o glossário em `GLOSSARY.md` e linkam o primeiro uso nos seus arquivos Markdown, com o significado como title ao passar o mouse.
- **SONUB** — dentro do repositório da SONUB, ela se apoia no glossário Laravel da própria SONUB (17 idiomas, a voz do tutor de IA) em vez de criar um segundo sistema.

### Instalação

Como em [Instalação](#instalação--global-usuário-ou-por-projeto) acima, com o nome de plugin **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — todos os projetos
claude plugin install popup@sonub-skills --scope project    # este projeto, compartilhado com a equipe
```

Precisa de Python 3.8+ para a ferramenta. O kit roda em qualquer navegador moderno.

### Como usar

| Você diz | Ela faz |
|------|------|
| `/popup docs/getting-started.md` · "adicione popups de glossário a esta página" | Encontra as palavras difíceis, escreve as entradas, conecta o kit e confere tudo num navegador |
| `/popup token, sampling, temperature` | Escreve essas três entradas e as anexa onde são usadas |
| "explique os itens do menu ao passar o mouse" | Adiciona prévias ao passar o mouse nos links, com botões "?" para celulares e teclados |
| "deixe o README amigável para iniciantes" | Gera o `GLOSSARY.md` e linka o primeiro uso de cada termo, com o significado ao passar o mouse |
| "traduza o glossário para japonês" | Adiciona `ja` a cada entrada e confere se não falta nada |

Instalada como plugin, `/popup:popup …` também funciona. Codex: `$popup …`.

### A ferramenta — `scripts/popup.py`

Só a biblioteca padrão do Python.

```bash
python3 scripts/popup.py init popup --locales en,ko   # copia popup.js/css, cria o glossary.json, grava o .popup.json
python3 scripts/popup.py audit docs                   # termos usados por arquivo + jargão sem entrada
python3 scripts/popup.py add new-terms.json --dry-run # mescla termos novos (conferidos, nunca sobrescreve em silêncio)
python3 scripts/popup.py check                        # valida o glossário
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown no GitHub
```

Depois adicione duas tags ao seu layout:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Estrutura do repositório

```
.claude-plugin/marketplace.json   ← o marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← a skill: quando e como usá-la
├─ .claude-plugin/plugin.json     ← informações do plugin (só Claude Code; outras ferramentas ignoram)
├─ scripts/gp.py                  ← a ferramenta
└─ references/                    ← leia quando precisar
   ├─ github-projects.md          ← conceitos, conta, login, primeiro quadro
   └─ commands.md                 ← todos os comandos + receitas com gh / GraphQL
skills/claude-skill/
├─ SKILL.md                       ← a skill: quando e como usá-la
├─ .claude-plugin/plugin.json     ← informações do plugin (nome do plugin cc-skill)
├─ scripts/cc.py                  ← ferramenta de estudo: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 lições · análise da Academy · recursos do CHANGELOG · folha de consulta · guias de criação · dicas · quiz
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← a skill: quando e como usá-la
├─ .claude-plugin/plugin.json     ← informações do plugin
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← ferramentas só da SONUB (glossário Laravel)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Aprenda como as skills funcionam no capítulo **Agent Skills** do curso de IA da SONUB: https://sonub.com/pt/learn/ai#agent-skill

Licença: [MIT](LICENSE)
