# rEVMe - Reverse Engineering for EVM

## Interface complétée 

✅ **Barre de menu personnalisée avec :**
- **Menus fonctionnels** : File, View, Windows, Help
- **Actions intégrées** : Open File, Minimize, Maximize, Close
- **Logo et branding** avec icône distinctive
- **Toggle de thème** intégré
- **Contrôles de fenêtre** stylisés (min, max, close)

✅ **Barre de statut** :
- Indicateur de statut en temps réel
- Informations bytecode (taille, instructions)
- Position PC sélectionnée
- Version de l'application

✅ **Design professionnel** :
- Interface sombre optimisée
- Animations et transitions fluides  
- Fenêtre sans décoration native (custom titlebar)
- Raccourcis clavier intégrés
- Menus dropdown avec séparateurs

## Architecture de l'interface

```
┌─────────────────────────────────────────────────┐
│ [Logo] File View Windows Help     [Theme] [-][□][×] │
├─────────────────────────────────────────────────┤
│                                                 │
│            Golden Layout Panels                 │
│         (Bytecode | Opcodes | Graph)            │
│                                                 │
├─────────────────────────────────────────────────┤
│ ● Ready | Bytecode: 1024 bytes | v0.1.0         │
└─────────────────────────────────────────────────┘
```

## Fonctionnalités implémentées

- **Drag region** pour déplacer la fenêtre
- **Gestion des événements** de fenêtre (min/max/close)
- **Menu contextuel** avec actions
- **État global** de l'application
- **Integration native** Tauri
