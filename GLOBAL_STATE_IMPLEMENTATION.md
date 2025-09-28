# Global State Management Implementation

## Vue d'ensemble
J'ai implémenté un système de gestion d'état global pour que lorsqu'un fichier bytecode est ouvert via le menu (File → Open Bytecode), il soit automatiquement chargé et affiché dans toutes les vues (Bytecode, Opcodes, et Graph).

## Modifications apportées

### 1. Création du Context Global (`src/context/AppContext.tsx`)
- **AppContext** : Context React pour partager l'état global
- **AppProvider** : Provider pour encapsuler l'application
- **useAppContext** : Hook personnalisé pour accéder au context

#### État global géré :
```typescript
interface AppState {
  bytecodeData: BytecodeData | null;      // Données du fichier bytecode
  opcodeInstructions: OpcodeInstruction[]; // Instructions désassemblées
  cfgData: CFGData | null;                 // Données du Control Flow Graph
  loading: boolean;                        // État de chargement
  error: string | null;                    // Erreurs
}
```

#### Fonctions exposées :
- `loadBytecodeFile()` : Ouvre un fichier .bin via dialog et charge toutes les données
- `loadBytecodeHex(hex: string)` : Charge du bytecode depuis une chaîne hex
- `clearData()` : Efface toutes les données

### 2. Intégration du Provider (`src/App.tsx`)
- Ajout du `AppProvider` autour de l'application
- Séparation en `AppContent` (qui utilise le context) et `App` (qui fournit le provider)
- Suppression des props obsolètes du MenuBar

### 3. Mise à jour des Composants

#### BytecodePanel (`src/components/BytecodePanel.tsx`)
- Utilise `useAppContext()` au lieu d'un état local
- Affiche automatiquement les données quand elles sont chargées via le menu
- Bouton "Load Hex" pour charger du bytecode manuellement
- Gestion d'erreurs unifiée

#### OpcodesPanel (`src/components/OpcodesPanel.tsx`)
- Entièrement réécrit pour utiliser le context global
- Affiche automatiquement les opcodes quand un fichier est chargé
- Fonctionnalités de tri et recherche conservées
- Panel de détails pour les opcodes sélectionnés

#### GraphPanel (`src/components/GraphPanel.tsx`)
- Réécrit pour utiliser le context global
- Affiche automatiquement le CFG quand un fichier est chargé
- Interface ReactFlow conservée
- Panel de détails pour les nœuds sélectionnés

#### MenuBar (`src/components/MenuBar.tsx`)
- Utilise `loadBytecodeFile()` du context au lieu d'une fonction locale
- Suppression des props `onOpenFile` et `onAbout`
- Intégration directe avec le système de gestion d'état

### 4. Flux de données unifié

#### Ouverture d'un fichier via le menu :
1. L'utilisateur clique sur "File → Open Bytecode"
2. `handleOpenBytecode()` dans MenuBar appelle `loadBytecodeFile()`
3. `loadBytecodeFile()` dans AppContext :
   - Ouvre le dialog de fichier (Tauri API)
   - Charge le bytecode brut
   - Désassemble les opcodes (API Rust)
   - Génère le CFG (API Rust)
   - Met à jour l'état global
4. Tous les composants (BytecodePanel, OpcodesPanel, GraphPanel) se mettent à jour automatiquement

#### Avantages de cette approche :
- **Synchronisation automatique** : Toutes les vues sont toujours à jour
- **Performance** : Une seule fois de chargement et traitement
- **Cohérence** : Même fichier affiché partout
- **Maintenance** : Code centralisé et réutilisable

## État des fonctionnalités

### ✅ Fonctionnalités opérationnelles :
- Ouverture de fichiers .bin via le menu
- Chargement automatique dans toutes les vues
- Affichage du bytecode formaté
- Désassemblage des opcodes avec détails
- Génération et visualisation du CFG
- Interface utilisateur cohérente

### 🔧 Fonctionnalités préservées :
- Recherche et tri dans les opcodes
- Sélection et détails des opcodes
- Navigation dans le CFG
- Sélection et détails des blocs
- Raccourcis clavier (Ctrl+O pour ouvrir)
- Thème sombre et interface premium

### 📋 Prochaines étapes possibles :
- Tests unitaires pour le context
- Gestion d'historique des fichiers récents
- Export des données analysées
- Comparaison de fichiers bytecode
- Annotations utilisateur sur le CFG

## Utilisation
Maintenant, quand l'utilisateur utilise le menu "File → Open Bytecode", le fichier sera automatiquement chargé et affiché dans les trois vues principales de l'application de façon synchronisée.
