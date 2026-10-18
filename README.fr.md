# sonub-skills — Agent Skills de SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · **Français** · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Ce dépôt est une **marketplace de skills**. Chaque skill est une [Agent Skill](https://agentskills.io) standard — un dossier contenant un `SKILL.md` — elle fonctionne donc dans Claude Code, Codex, Gemini CLI, GitHub Copilot CLI et tout autre agent qui lit les Agent Skills. Claude Code peut aussi l'installer comme plugin depuis cette marketplace (`sonub-skills`), ce qui permet de la mettre à jour en une seule commande.

| Skill | Ce qu'elle fait |
|------|------|
| [`gp`](skills/gp) | Gérez tout votre travail dans **GitHub Projects** avec git et la CLI `gh` |
| [`claude-skill`](skills/claude-skill) | **Apprenez Claude Code et maîtrisez-le de mieux en mieux** — 14 leçons avec quiz, des réponses vérifiées dans la documentation officielle, un diagnostic de votre configuration, un résumé de chaque nouveauté du CHANGELOG et `/claude-skill update` pour récupérer les suivantes (nom du plugin `cc-skill`) |
| [`popup`](skills/popup) | **Expliquez le jargon avec des popups au survol** dans les pages et la documentation de n'importe quel projet — sens, mots simples, exemples, code source, termes liés et liens « en savoir plus » vers vos propres pages, à partir d'un seul JSON de glossaire |

## Installation — globale (utilisateur) ou par projet

Toutes les skills s'installent de la même façon. Remplacez `<plugin>` par le nom du plugin indiqué dans le tableau (`gp`, `cc-skill`, `popup`).

**Étape 1 — ajoutez la marketplace (une fois par ordinateur)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Étape 2 — installez là où vous le voulez**

| Portée | Commande | Pour qui, où | Enregistré dans |
|------|------|------|------|
| **Globale (utilisateur)** — par défaut | `claude plugin install <plugin>@sonub-skills` | vous, dans tous les projets de cet ordinateur | `~/.claude/settings.json` |
| **Projet (partagé avec l'équipe)** | dans le dossier du projet : `claude plugin install <plugin>@sonub-skills --scope project` | toutes les personnes qui travaillent dans ce dépôt | `.claude/settings.json` (à commiter) |
| **Locale (vous seul, ce projet uniquement)** | dans le dossier du projet : `claude plugin install <plugin>@sonub-skills --scope local` | vous, dans ce dépôt uniquement | `.claude/settings.local.json` |

- Dans une session, `/plugin install <plugin>@sonub-skills` ouvre un écran où vous choisissez la portée. Si vous avez installé depuis le terminal, exécutez `/reload-plugins` dans les sessions ouvertes.
- Vérifier : `claude plugin list` (affiche la portée). Mettre à jour : `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Désinstaller : `claude plugin uninstall <plugin>@sonub-skills`.
- Quand un même plugin est défini à plusieurs portées, la portée locale l'emporte sur celle du projet, et celle du projet l'emporte sur la portée globale.

**Faites-le installer automatiquement chez vos coéquipiers** — commitez ceci dans le `.claude/settings.json` du dépôt. Dès qu'un coéquipier fait confiance au dossier, Claude Code ajoute la marketplace et installe les plugins.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Sans plugins — copiez le dossier** dans le dossier de skills de votre agent (`<skill>` = `gp`, `claude-skill` ou `popup`).

| Outil | Globale (utilisateur) | Projet |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<projet>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<projet>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # ce projet uniquement : DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Le plus simple** — dites à votre agent *« installe le plugin cc-skill depuis thruthesky/sonub-skills, globalement »* (ou *« pour ce projet uniquement »*) et il exécute les commandes ci-dessus pour vous.

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
   - Si je t'ai demandé « pour ce projet uniquement », exécute la dernière ligne dans le dossier du projet en ajoutant --scope project.
   - Si elle est déjà installée, exécute plutôt : claude plugin update gp@sonub-skills
2. Tout autre agent : place-la dans le dossier de skills DIR — tous les projets : ~/.agents/skills, ce projet uniquement : <projet>/.agents/skills.
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

#### Installation globale et installation locale (projet)

| | Globale — tous les projets | Locale — ce projet uniquement |
|------|------|------|
| Plugin Claude Code | `claude plugin install gp@sonub-skills` | dans le dossier du projet : `claude plugin install gp@sonub-skills --scope project` (écrit dans `.claude/settings.json`, partagé avec l'équipe · vous seul : `--scope local`) |
| Claude Code, copie du dossier | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Tableau utilisé | `/gp init <URL du tableau> --global` → `~/.config/gp/config.json` | `/gp init <URL du tableau>` → `<projet>/.gp.json` |

L'endroit où la skill est installée et le tableau qu'elle utilise se choisissent séparément. En général, on installe la skill globalement une seule fois, puis on donne à chaque projet son tableau avec `/gp init <URL du tableau>`.

### Premier lancement

Demandez à votre agent *« configure gp »* (Claude Code : `/gp:gp`, Codex : `$gp`). Il exécute :

```bash
python3 scripts/gp.py doctor                    # gh ✓ · connecté ✓ · scopes ✓ · tableau par défaut
gh auth login                                   # seulement si vous n'êtes pas connecté — saisissez le code à usage unique dans le navigateur
gh auth refresh -s project,repo                 # seulement s'il manque un scope
python3 scripts/gp.py projects                  # vos tableaux
python3 scripts/gp.py init <URL du tableau>     # le tableau de ce projet (.gp.json) · tous les projets : --global … ou créez-en un :
python3 scripts/gp.py project-create --title "Mon travail" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Choisir le tableau — `/gp init`

Chaque projet de développement peut avoir son propre tableau GitHub Project. Donnez l'adresse du tableau à votre agent dans le dossier du projet, et le travail de ce projet ira sur ce tableau.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Installée comme plugin Claude Code : `/gp:gp init …` ; Codex : `$gp init …`. Dire « utilise https://… comme tableau de ce projet » fonctionne aussi.

- **Local (par défaut)** — dans un dépôt git, le réglage est enregistré dans `<racine du dépôt>/.gp.json` et utilisé uniquement dans ce projet (et ses sous-dossiers). Il ne contient aucun secret : commitez-le pour que vos coéquipiers utilisent le même tableau, ou ajoutez-le à `.gitignore` pour le garder pour vous.
- **Global** — `/gp init <URL> --global` (ou « fais-en le tableau par défaut de tous les projets ») → `~/.config/gp/config.json`, utilisé dans tout dossier sans `.gp.json`.
- N'importe quelle page du tableau convient (`/views/2`, tableaux d'utilisateur `/users/…`, tableaux d'organisation `/orgs/…`). On vérifie que le tableau existe et est lisible avant de l'enregistrer.
- `/gp init` seul affiche le tableau utilisé et son fichier de réglages. Supprimer : `gp.py init --unset` (global : `--unset --global`).
- `/gp init` écrit aussi une consigne dans `AGENTS.md`/`CLAUDE.md` de ce projet et dans vos fichiers globaux `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md` : « utilise toujours la skill gp pour créer, modifier, supprimer, lister ou chercher les issues, tâches et TODO de GitHub Project ». Avec une URL, il ajoute « travaille sur ce tableau » avec cette URL. Le relancer ne met à jour que cette partie ; `--show` affiche seulement, `--no-instructions` l'ignore, `--remove-instructions` la supprime.
- Quel tableau est utilisé : `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → le `.gp.json` du projet → le réglage global.

### Utilisation — il suffit de le dire

| Vous dites | L'agent exécute |
|------|------|
| « Crée une issue : le bouton de connexion ne fait rien sur iPhone. Étapes : reproduire, corriger, tester. Joins shot.png » | `create --repo app --title "…" --todo reproduire --todo corriger --todo tester --image shot.png` → colonne Todo |
| « /gp init https://github.com/orgs/my-team/projects/3 » | `init …` → enregistré comme tableau de ce projet (`.gp.json`) |
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
- **Le réglage du tableau** est enregistré par projet dans `.gp.json` (local) et pour tous les projets dans `~/.config/gp/config.json` (global). `--owner/--number` ou `GP_OWNER`/`GP_PROJECT` l'emportent sur les deux.

Remarque : juste après la création d'une issue, la liste du projet sur GitHub peut mettre quelques secondes à l'afficher. La ligne `check:` lit l'issue directement et est toujours à jour.

### Mise à jour et suppression

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Autres agents : relancez la ligne `curl … | tar` pour mettre à jour ; supprimez le dossier `gp` pour désinstaller.

## claude-skill — apprendre Claude Code et le maîtriser de mieux en mieux

Claude Code sort une nouvelle version presque chaque jour (plus de 400 à ce jour). Cette skill vous l'apprend dans l'ordre, répond à vos questions à partir de la **documentation officielle à jour** plutôt que de mémoire, vérifie votre configuration et tient un résumé de chaque nouveauté du CHANGELOG. Un seul `/claude-skill update` ajoute à la skill les fonctionnalités qui viennent de sortir.

### Ce qu'elle couvre

- **Un parcours de 14 leçons** — de l'installation et des premiers prompts jusqu'à explorer → planifier → coder → commiter, la gestion du contexte, CLAUDE.md et la mémoire, les modes de permission, les checkpoints, les skills, les sous-agents, les hooks, MCP, les plugins et marketplaces, l'exécution headless et GitHub Actions, et le travail long sans surveillance avec vérification. Chaque leçon comporte un **exercice dans votre propre projet** et des questions de contrôle, et votre progression est enregistrée.
- **Claude Academy, analysée** — les 64 tutoriels Claude de [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat), plus les tutoriels et cours Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents), avec ce que vous apprenez dans le chat (Projects, mémoire, connecteurs, skills, Research, choix du modèle et de l'effort…) mis en regard de la façon de le faire dans Claude Code.
- **Des réponses vérifiées dans la documentation** — pour « comment fonctionnent les hooks ? » ou « qu'est-ce que la portée d'un plugin ? », elle cherche et lit code.claude.com, puis répond avec la commande, un exemple et le lien vers la documentation.
- **Chaque nouveauté du CHANGELOG** — les 422 versions du [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), sans les corrections de bugs, résumées en 14 thèmes, plus les 30 fonctionnalités à connaître et les derniers ajouts.
- **`/claude-skill update`** — récupère le dernier CHANGELOG, repère les versions que la skill ne couvre pas encore, ajoute leurs fonctionnalités aux notes, à l'aide-mémoire et aux leçons, et note jusqu'où elle est à jour.
- **Diagnostic de la configuration** — examine votre version, vos fichiers de réglages (utilisateur, projet, local), la longueur de CLAUDE.md, les règles, la mémoire automatique, les skills, les sous-agents, les plugins et les serveurs MCP, et propose des corrections.
- **Aide-mémoire, astuces et guides de création** — commandes, raccourcis, options de la CLI et emplacements des fichiers sur une seule page ; les habitudes qui marchent ; comment créer des skills, des sous-agents, des hooks, des serveurs MCP, des plugins et des marketplaces.

### Installation

Comme dans [Installation](#installation--globale-utilisateur-ou-par-projet) plus haut. Le plugin s'appelle **`cc-skill`** (Claude Code réserve les noms de plugin commençant par `claude-` à ceux d'Anthropic). La skill garde le nom `claude-skill`, vous l'appelez donc avec `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # globale — tous les projets
claude plugin install cc-skill@sonub-skills --scope project    # ce projet, partagé avec l'équipe
```

Nécessite Python 3.8+ et un accès à Internet (elle lit la documentation officielle et le CHANGELOG).

### Utilisation

| Vous dites | Elle fait |
|------|------|
| `/claude-skill` · « étudions Claude Code » | Affiche les leçons et votre progression, puis lance la suivante |
| `/claude-skill lesson 5` · « leçon suivante » | Donne la leçon, fait l'exercice dans votre projet, pose des questions de contrôle et enregistre la progression |
| `/claude-skill quiz` | Cinq questions sur ce que vous avez étudié, une à la fois, avec un score |
| « Comment lancer prettier après chaque modification avec un hook ? » | Lit la documentation officielle et répond avec un exemple de configuration et le lien |
| `/claude-skill new` · « quoi de neuf ? » | Les nouveautés récentes les plus utiles d'abord, chacune avec la façon de l'essayer |
| `/claude-skill doctor` · « vérifie ma configuration » | Passe en revue votre configuration et propose des corrections (demande avant de modifier quoi que ce soit) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Les habitudes qui marchent · commandes et raccourcis · l'analyse de l'Academy |
| `/claude-skill build skill` · « crée-moi un hook » | Choisit le bon mécanisme et le construit avec vous dans votre projet |
| `/claude-skill update` | Met à jour les notes de fonctionnalités de la skill à partir du dernier CHANGELOG |

Installée comme plugin, `/cc-skill:claude-skill …` fonctionne aussi. Codex : `$claude-skill …`.

### Fonctionnement de `/claude-skill update`

1. `scripts/cc.py update-check` compare la version couverte par les notes (la marque `covered-through` dans `references/changelog-features.md`) avec la dernière version du CHANGELOG.
2. Sur une copie installée comme plugin, elle lance d'abord `claude plugin update cc-skill@sonub-skills` pour obtenir les notes publiées. Pour modifier la source de la skill (un checkout git), passez `--source <dossier>`. Sans source, elle écrit dans `~/.config/claude-skill/changelog-local.md`, qui survit aux mises à jour du plugin.
3. `cc.py changelog --since <version couverte>` liste les éléments des nouvelles versions (corrections masquées) ; l'agent ajoute les nouvelles fonctionnalités à leurs thèmes, réécrit les « derniers ajouts », ajoute les nouvelles commandes et les nouveaux raccourcis à l'aide-mémoire et corrige les leçons devenues inexactes.
4. `cc.py mark-covered <dernière version>` déplace la marque ; dans un checkout git, elle incrémente la version et commite (ne pousse que si vous le demandez).
5. Elle indique la plage couverte et 3 à 7 nouveautés à essayer, avec la façon d'essayer chacune.

### L'outil — `scripts/cc.py`

Uniquement la bibliothèque standard de Python.

```bash
python3 scripts/cc.py doctor                 # vérifie votre configuration Claude Code + conseils
python3 scripts/cc.py docs hooks             # cherche dans la documentation officielle (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # lit une section d'une page
python3 scripts/cc.py changelog --count 5    # les 5 dernières versions (corrections masquées)
python3 scripts/cc.py changelog --grep worktree --count 400   # trouve une fonctionnalité par son nom
python3 scripts/cc.py update-check           # versions couvertes vs dernière version
python3 scripts/cc.py lessons                # leçons et progression
```

## popup — expliquer chaque mot difficile là où le lecteur le rencontre

Un lecteur bute sur un mot inconnu — « token », « endpoint », « idempotent » — et perd tout le paragraphe. Cette skill pose une petite carte sur ce mot : survolez-le (touchez-le sur un téléphone, mettez-le au focus au clavier) et elle explique le terme par couches — sens en une ligne, courte explication, comparaison de la vie courante, lignes d'exemple, extrait de code source, termes liés et un **lien « en savoir plus » vers une autre page de votre propre projet**. Elle fonctionne dans n'importe quel projet : sites statiques, générateurs de documentation, applications monopages, sites rendus côté serveur et simple Markdown lu sur GitHub.

### Ce qu'elle couvre

- **Un glossaire, un seul endroit** — toutes les explications vivent dans un seul fichier JSON (ou un par langue) ; les pages ne font que pointer vers des identifiants de termes, si bien qu'un même mot se lit de la même façon partout.
- **Un kit prêt à l'emploi** — `popup.js` et `popup.css`, sans framework et sans étape de build. Le texte brut dans `main`/`article` est enveloppé automatiquement (à la première occurrence par page) ; un balisage explicite existe pour les expressions, les phrases, les boutons « ? » et les liens qui s'aperçoivent au survol. Une carte par page, épinglée au clic, les pastilles de termes liés changent le contenu sur place, Échap rend le focus, feuille en bas d'écran (bottom sheet) sur téléphone, langues écrites de droite à gauche, mode sombre et thèmes via des variables CSS.
- **Reconnaissance intelligente** — la graphie la plus longue d'abord, limites de mots propres à chaque écriture (latin, cyrillique, particules du coréen, préfixes de l'arabe, CJK), termes qui ne valent que dans une section (`scope`) et noms de commandes sensibles à la casse.
- **Règles d'écriture** — comment rédiger une carte qu'un débutant comprend en une lecture, dans chaque langue livrée par le projet : à quoi sert chaque champ, longueurs, une comparaison, faits vérifiés et exemples dès qu'il en existe de réels.
- **Outils** — `popup.py check` valide le glossaire (toutes les locales, code d'exemple identique d'une langue à l'autre, identifiants liés, existence des cibles « en savoir plus », conflits de graphie) ; `audit` montre quels termes un document utilise déjà et repère le jargon qui n'a pas encore d'entrée ; `add` fusionne de nouveaux termes en toute sécurité ; `md` + `link` transforment le glossaire en `GLOSSARY.md` et lient la première occurrence dans vos fichiers Markdown, avec le sens comme title au survol.
- **SONUB** — dans le dépôt SONUB, elle s'appuie sur le glossaire Laravel propre à SONUB (17 langues, la voix du tuteur IA) au lieu d'ajouter un second système.

### Installation

Comme dans [Installation](#installation--globale-utilisateur-ou-par-projet) plus haut, avec le nom de plugin **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # globale — tous les projets
claude plugin install popup@sonub-skills --scope project    # ce projet, partagé avec l'équipe
```

Nécessite Python 3.8+ pour l'outil. Le kit fonctionne dans tout navigateur moderne.

### Utilisation

| Vous dites | Elle fait |
|------|------|
| `/popup docs/getting-started.md` · « ajoute des popups de glossaire à cette page » | Repère les mots difficiles, rédige les entrées, branche le kit et vérifie le tout dans un navigateur |
| `/popup token, sampling, temperature` | Rédige ces trois entrées et les rattache là où elles sont utilisées |
| « explique les éléments du menu au survol » | Ajoute des aperçus au survol sur les liens, avec des boutons « ? » pour les téléphones et le clavier |
| « rends le README accessible aux débutants » | Génère `GLOSSARY.md` et lie la première occurrence de chaque terme, avec le sens au survol |
| « traduis le glossaire en japonais » | Ajoute `ja` à chaque entrée et vérifie qu'il ne manque rien |

Installée comme plugin, `/popup:popup …` fonctionne aussi. Codex : `$popup …`.

### L'outil — `scripts/popup.py`

Uniquement la bibliothèque standard de Python.

```bash
python3 scripts/popup.py init popup --locales en,ko   # copie popup.js/css, crée glossary.json, écrit .popup.json
python3 scripts/popup.py audit docs                   # termes utilisés par fichier + jargon sans entrée
python3 scripts/popup.py add new-terms.json --dry-run # fusionne de nouveaux termes (vérifiés, n'écrase jamais en silence)
python3 scripts/popup.py check                        # valide le glossaire
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown sur GitHub
```

Ajoutez ensuite deux balises à votre mise en page :

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Structure du dépôt

```
.claude-plugin/marketplace.json   ← la marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← la skill : quand et comment l'utiliser
├─ .claude-plugin/plugin.json     ← infos du plugin (Claude Code uniquement ; les autres outils l'ignorent)
├─ scripts/gp.py                  ← l'outil
└─ references/                    ← à lire au besoin
   ├─ github-projects.md          ← concepts, compte, connexion, premier tableau
   └─ commands.md                 ← toutes les commandes + recettes gh / GraphQL brutes
skills/claude-skill/
├─ SKILL.md                       ← la skill : quand et comment l'utiliser
├─ .claude-plugin/plugin.json     ← infos du plugin (nom du plugin cc-skill)
├─ scripts/cc.py                  ← outil d'étude : doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 leçons · analyse de l'Academy · nouveautés du CHANGELOG · aide-mémoire · guides de création · astuces · quiz
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← la skill : quand et comment l'utiliser
├─ .claude-plugin/plugin.json     ← infos du plugin
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← outils réservés à SONUB (glossaire Laravel)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Découvrez comment fonctionnent les skills dans le chapitre **Agent Skills** du cours d'IA de SONUB : https://sonub.com/fr/learn/ai#agent-skill

Licence : [MIT](LICENSE)
