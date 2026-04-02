**Passer à un Framework & TypeScript** : Migrer vers React, Vue ou Svelte avec
TypeScript. Cela permet de modulariser le code, de sécuriser les types (très
important quand on manipule des opcodes et des hexadécimaux) et de rendre le
projet maintenable.

**Virtualisation du DOM** : Pour la vue Désassembleur et Hexadécimale, il faut
utiliser des bibliothèques de virtualisation (comme react-window ou TanStack
Virtual). Au lieu de créer 15 000 éléments HTML pour un gros contrat, l'outil ne
rendra que les 50 lignes visibles à l'écran, garantissant un défilement
ultra-fluide.

**Version Desktop (Offline)** : Les auditeurs professionnels travaillent souvent
sur du code confidentiel avant son déploiement. Encapsuler l'outil avec Tauri
permettrait de l'utiliser 100% hors-ligne, sans fuite de données vers des RPC
publics.

**Moteur de Requêtes Personnalisées** : Au lieu d'avoir un scanner statique codé
en dur, l'outil doit permettre à l'auditeur d'écrire ses propres scripts en
**CodeQL** de détection. Par exemple : "Trouve tous les chemins où SLOAD(X) est
influencé par CALLER et suivi d'un CALL".

**Renommage Symbolique Propagé** : L'auditeur doit pouvoir cliquer sur une
adresse mémoire (MSTORE 0x40), un slot de storage ou une variable dans la pile
(stack) et la renommer (ex: user_balance_ptr). Ce nom doit ensuite se propager
automatiquement dans tout le reste du désassemblage et du graphe.

**Vraie Décompilation via IR** : Le système actuel "devine" les fonctions
standards (ERC20). Un vrai décompilateur doit "lifter" (élever) les opcodes EVM
vers une Représentation Intermédiaire (IR, comme Yul), puis reconstruire l'arbre
syntaxique abstrait (AST) pour générer du code Solidity lisible.

**Exécution Symbolique (Symbolic Execution)** : Intégrer un solveur mathématique
(comme Z3) pour explorer tous les chemins d'exécution possibles du contrat et
détecter les vulnérabilités de manière déterministe (dépassement d'entier,
manipulation de msg.value, etc.).

**Proxy Backend** : Ne plus exposer les clés API (RPC, Etherscan) dans le code
front-end ou le LocalStorage de l'utilisateur. Utiliser un backend léger
(Node.js) pour relayer les requêtes et gérer le rate-limiting.

**Base de Données de Signatures** : Au lieu de dépendre uniquement de
4byte.directory à la volée, héberger un cache massif de millions de signatures
de fonctions et d'événements pour une résolution instantanée.

**Génération de Squelettes Foundry** : Lorsqu'un auditeur isole un chemin
vulnérable dans le graphe, un bouton devrait lui permettre de générer
instantanément un test PoC (Proof of Concept) en Solidity, pré-rempli avec les
bons calldatas pour atteindre ce bloc spécifique.

**Fork de l'État Local (State Forking)** : Intégrer un mini-nœud en arrière-plan
(se brancher sur Anvil) pour permettre à l'auditeur de simuler l'exécution du
contrat à un bloc exact du réseau principal, avec l'état réel de la blockchain.
