# sonub-skills — Agent Skills de SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · **Français** · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Ce dépôt est une **marketplace de skills**. Chaque skill est une [Agent Skill](https://agentskills.io) standard — un dossier contenant un `SKILL.md` — elle fonctionne donc dans Claude Code, Codex, Gemini CLI, GitHub Copilot CLI et tout autre agent qui lit les Agent Skills. Claude Code peut aussi l'installer comme plugin depuis cette marketplace (`sonub-skills`), ce qui permet de la mettre à jour en une seule commande.

| Skill | Ce qu'elle fait |
|------|------|
| [`gp`](skills/gp) | Gérez tout votre travail dans **GitHub Projects** avec git et la CLI `gh` |

---

## gp — tout votre travail sur un tableau GitHub Project

Vous parlez à votre agent IA avec des mots simples — *« crée une issue : le bouton de connexion ne fait rien sur iPhone, joins cette capture d'écran »*, *« déplace-la dans Done »*, *« ajoute une colonne Review »*, *« qu'est-ce que j'ai à faire ? »* — et l'agent le fait sur votre tableau GitHub Project avec `gh`, puis relit le résultat pour le confirmer.

### Ce qu'elle couvre

- **GitHub Projects expliqué** — dépôt, issue, projet (tableau), élément, brouillon, champ, Status = colonnes, vue, workflow. Votre agent peut vous l'expliquer dans votre langue.
- **Compte et connexion** — étapes d'inscription pour un nouveau compte GitHub, installation de `gh`, `gh auth login`, les scopes `project` et `repo`.
- **Tableaux** — créer, renommer, décrire, rendre public/privé, fermer/rouvrir, supprimer, lier des dépôts, lister vos tableaux, choisir un tableau par défaut.
- **Colonnes (kanban)** — ajouter, renommer (les cartes restent), réordonner, colorer, supprimer (déplacez d'abord les cartes ailleurs).
- **Champs et vues** — champs personnalisés (texte, nombre, date, sélection unique), vues tableau/table/feuille de route avec filtres.
- **Issues** — créer (dans une colonne, avec labels, milestone, issue parente, champs personnalisés), modifier, déplacer entre colonnes, fermer (passe dans Done), rouvrir, commenter, retirer du tableau, archiver, supprimer.
- **Images** — joindre des captures d'écran ou des vidéos au corps d'une issue ou à un commentaire.
- **TODO** — une checklist `- [ ]` dans une issue : ajouter, cocher, décocher, supprimer ; la progression s'affiche dans les listes. Des éléments brouillons pour les idées rapides, convertis en issues plus tard.
- **Personnes** — assigner et désassigner, voir qui a quoi, inviter des collaborateurs sur un dépôt et donner des rôles sur le tableau.

### Prérequis

- Un compte GitHub (gratuit). Pas encore de compte ? Inscrivez-vous sur https://github.com/signup — code par e-mail, puzzle, offre Free (environ trois minutes).
- [`gh`](https://cli.github.com) — la CLI GitHub (macOS `brew install gh`, Windows `winget install GitHub.cli`), connectée avec les scopes `project` et `repo`.
- Python 3.8 ou plus récent (bibliothèque standard uniquement).

### Installation

**Le plus simple — laissez votre agent s'en charger.** Copiez ce bloc dans Claude Code, Codex, Gemini CLI ou Copilot CLI et envoyez-le :

```text
Installe la skill gp depuis le dépôt thruthesky/sonub-skills.
Chemin de la skill : https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — une Agent Skill standard (un dossier avec SKILL.md).

1. Si tu es Claude Code, installe-la comme plugin en exécutant ces commandes dans l'ordre (ignore les erreurs « already added ») :
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Si elle est déjà installée, exécute plutôt : claude plugin update gp@sonub-skills
2. Tout autre agent : place-la dans ton dossier de skills utilisateur DIR (Codex, Gemini CLI, Copilot CLI : ~/.agents/skills).
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Exécute : python3 <dossier de la skill>/scripts/gp.py doctor — et corrige ce qu'il signale (installer gh, gh auth login, gh auth refresh -s project,repo).
4. Dis-moi en bref ce qui a été installé, le résultat de doctor, et que je peux maintenant dire des choses comme « montre mes projets GitHub ».
```

**Claude Code — deux lignes dans un terminal** (fonctionne dans toutes les versions) :

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

Dans un chat, utilisez `/plugin marketplace add thruthesky/sonub-skills` puis `/plugin install gp@sonub-skills`. Les versions plus récentes acceptent aussi une seule ligne : `claude plugin install gp --marketplace thruthesky/sonub-skills`. Après une installation depuis un terminal, exécutez `/reload-plugins` dans un chat ouvert (ou redémarrez).

**N'importe quel agent — copiez le dossier** dans le dossier de skills de l'agent :

| Outil | Dossier de skills utilisateur | Dossier de skills du projet |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### Premier lancement

Demandez à votre agent *« configure gp »* (Claude Code : `/gp:gp`, Codex : `$gp`). Il exécute :

```bash
python3 scripts/gp.py doctor                    # gh ✓ · connecté ✓ · scopes ✓ · tableau par défaut
gh auth login                                   # seulement si vous n'êtes pas connecté — saisissez le code à usage unique dans le navigateur
gh auth refresh -s project,repo                 # seulement s'il manque un scope
python3 scripts/gp.py projects                  # vos tableaux
python3 scripts/gp.py use <owner> <number>      # choisissez-en un … ou créez-en un :
python3 scripts/gp.py project-create --title "Mon travail" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Utilisation — il suffit de le dire

| Vous dites | L'agent exécute |
|------|------|
| « Crée une issue : le bouton de connexion ne fait rien sur iPhone. Étapes : reproduire, corriger, tester. Joins shot.png » | `create --repo app --title "…" --todo reproduire --todo corriger --todo tester --image shot.png` → colonne Todo |
| « Mets-la en cours » · « Déplace #12 dans Review » | `move app#12 doing` · `move app#12 review` |
| « Terminé ! » | `close app#12` — ferme l'issue et la déplace dans Done |
| « Ajoute "mettre à jour la doc" à son TODO » · « coche le premier » | `todo app#12 add "mettre à jour la doc"` · `todo app#12 done 1` |
| « Ajoute une colonne Urgent au début » · « Renomme Review en QA » | `column-add Urgent --first --color red` · `column-rename Review QA` |
| « Confie-la à alice » · « Invite bob sur le dépôt » | `assign app#12 alice` · `invite bob --repo app` (demande d'abord) |
| « Qu'est-ce que j'ai à faire ? » | `list --assignee @me --state open`, puis propose une prochaine tâche |
| « Note une idée sur le tableau : mode sombre » | `create --draft --title "mode sombre"` |
| « Ajoute un champ Priority » | `field-add Priority --type single_select --options "High,Medium,Low"` |

Toutes les commandes : [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Fonctionnement

- **Uniquement `gh` et la bibliothèque standard de Python.** gh est appelé avec une liste d'arguments (sans shell), et les titres et corps passent par stdin — guillemets, emojis et retours à la ligne ne cassent jamais rien.
- **Les ID par le nom.** Les ID des champs, colonnes et options sont recherchés à chaque exécution, vous pouvez donc renommer des colonnes sur le site sans rien casser. Renommer une colonne conserve ses cartes.
- **Chaque modification est relue.** Après une modification, le script affiche une ligne `check:` avec l'état réel sur GitHub (état, colonne, personnes assignées, labels). L'agent fait son rapport à partir de cette ligne.
- **Les images** utilisent le `--attach` de gh (GitHub user-attachments). Avec un gh plus ancien, les images sont commitées sur une branche `gp-assets` du dépôt de l'issue, puis liées.
- **Sûr par défaut.** Chaque commande qui modifie quelque chose a `--dry-run`. Supprimer une issue, un tableau, un champ ou une colonne contenant des cartes nécessite `--yes`, et la skill demande à l'agent de vous poser la question d'abord. Les invitations (qui envoient un e-mail à une vraie personne) sont aussi demandées d'abord.
- **Le tableau par défaut** est enregistré dans `~/.config/gp/config.json` ; remplacez-le avec `--owner/--number` ou `GP_OWNER`/`GP_PROJECT`.

Remarque : juste après la création d'une issue, la liste du projet sur GitHub peut mettre quelques secondes à l'afficher. La ligne `check:` lit l'issue directement et est toujours à jour.

### Mise à jour et suppression

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Autres agents : relancez la ligne `curl … | tar` pour mettre à jour ; supprimez le dossier `gp` pour désinstaller.

### Structure du dépôt

```
.claude-plugin/marketplace.json   ← la marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← la skill : quand et comment l'utiliser
├─ .claude-plugin/plugin.json     ← infos du plugin (Claude Code uniquement ; les autres outils l'ignorent)
├─ scripts/gp.py                  ← l'outil
└─ references/                    ← à lire au besoin
   ├─ github-projects.md          ← concepts, compte, connexion, premier tableau
   └─ commands.md                 ← toutes les commandes + recettes gh / GraphQL brutes
```

Découvrez comment fonctionnent les skills dans le chapitre **Agent Skills** du cours d'IA de SONUB : https://sonub.com/fr/learn/ai#agent-skill

Licence : [MIT](LICENSE)
