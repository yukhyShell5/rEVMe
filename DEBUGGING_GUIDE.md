# Guide de débogage - État de chargement des fichiers

## 🔧 Outils de débogage ajoutés

### 1. Logs détaillés dans AppContext
- ✅ Logs de chaque étape du processus `loadBytecodeFile()`
- ✅ Vérification du format de bytecode retourné par Rust
- ✅ Validation de l'extraction hex
- ✅ Logs des appels aux APIs Rust

### 2. Logs dans les composants
- ✅ BytecodePanel : logs des changements de `bytecodeData`
- ✅ OpcodesPanel : logs des changements de `opcodeInstructions`
- ✅ GraphPanel : logs des changements de `cfgData`

### 3. Panel de débogage visuel
- ✅ Bouton "Test Load File" pour tester directement
- ✅ Affichage en temps réel de l'état du contexte
- ✅ Indicateurs colorés pour chaque type de données

## 🧪 Comment tester

### Méthode 1 : Via le menu
1. Ouvrir la console du navigateur (F12)
2. Cliquer sur "File → Open Bytecode" dans le menu
3. Sélectionner le fichier `test_bytecode.bin`
4. Observer les logs dans la console

### Méthode 2 : Via le panel de débogage
1. Utiliser le bouton "Test Load File" dans le panel de débogage (coin bas-droit)
2. Observer les changements d'état en temps réel

## 📋 Diagnostics à vérifier

### Dans la console, vous devriez voir :
```
🚀 Starting loadBytecodeFile...
📁 Opening file dialog...
✅ File opened: test_bytecode.bin (XX bytes)
📄 Bytecode preview: 0x0000: 6080 6040 5234 8015...
🔍 Extracted hex data: 0x608060405234801561001057600080fd5b...
🔧 Disassembling bytecode...
✅ Opcodes loaded: XX instructions
📊 Generating CFG...
✅ CFG generated: XX nodes, XX edges
🎉 All data loaded successfully!
```

### Dans les composants :
```
📄 BytecodePanel - bytecodeData changed: {...}
🔧 OpcodesPanel - opcodeInstructions changed: XX instructions
📊 GraphPanel - cfgData changed: XX nodes, XX edges
```

## 🐛 Points de défaillance possibles

### 1. Dialog ne s'ouvre pas
- **Cause** : Permissions Tauri ou problème de plugin dialog
- **Symptôme** : "❌ No file selected or file opening failed"

### 2. Extraction hex échoue
- **Cause** : Format de bytecode différent de l'attendu
- **Symptôme** : "⚠️ Failed to extract hex data from bytecode"

### 3. APIs Rust ne répondent pas
- **Cause** : Fonctions non enregistrées ou erreurs dans le backend
- **Symptôme** : Erreurs d'invoke dans la console

### 4. Composants ne se mettent pas à jour
- **Cause** : Context non propagé ou problème de re-render React
- **Symptôme** : State dans DebugPanel change mais vues restent vides

## 🎯 Test file disponible

Un fichier de test `test_bytecode.bin` a été créé avec du bytecode EVM valide pour les tests.

## 🚀 Prochaines étapes

Une fois le problème identifié via les logs, nous pouvons :
1. Corriger la fonction défaillante
2. Améliorer la gestion d'erreurs
3. Supprimer les logs de débogage
4. Valider le fonctionnement complet
