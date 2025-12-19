# Améliorations Frontend Perfect Links v2

## 🎯 Défi #1 : Détection Automatique du Sitemap

### Modifications JavaScript

```javascript
// Dans la section createApp, ajouter :
detectedSitemaps: [],
selectedSitemap: null,
detectingS itemap: false,

// Nouvelle méthode : Détecter les sitemaps
async detectSitemaps() {
    if (!this.sitemapUrl) return;

    this.detectingSitemap = true;
    this.message = '';

    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
            `${API_URL}/detect-sitemap?url=${encodeURIComponent(this.sitemapUrl)}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (response.ok && data.sitemaps && data.sitemaps.length > 0) {
            this.detectedSitemaps = data.sitemaps;

            // Si un seul sitemap, l'utiliser directement
            if (data.sitemaps.length === 1) {
                this.selectedSitemap = data.sitemaps[0];
                this.analyzeSitemap();
            } else {
                // Afficher la liste pour choisir
                this.message = `${data.sitemaps.length} sitemaps détectés. Sélectionnez-en un.`;
                this.messageType = 'success';
            }
        } else {
            this.message = 'Aucun sitemap détecté. Vérifiez l\'URL.';
            this.messageType = 'error';
        }
    } catch (error) {
        this.message = 'Erreur lors de la détection du sitemap';
        this.messageType = 'error';
    } finally {
        this.detectingSitemap = false;
    }
},

// Modifier analyzeSitemap pour utiliser selectedSitemap
async analyzeSitemap() {
    const sitemapToAnalyze = this.selectedSitemap || this.sitemapUrl;

    this.loading = true;
    this.message = '';
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
            `${API_URL}/sitemap-analysis?url=${encodeURIComponent(sitemapToAnalyze)}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            }
        );
        const data = await response.json();
        if (response.ok) {
            this.analysisResult = Array.isArray(data) ? data[0] : data;
            this.networkInitialized = false;
            this.detectedSitemaps = []; // Reset
        } else {
            this.message = data.message || 'Erreur lors de l\'analyse';
            this.messageType = 'error';
        }
    } catch (error) {
        this.message = 'Erreur lors de l\'analyse';
        this.messageType = 'error';
    } finally {
        this.loading = false;
    }
}
```

### Modifications HTML

```html
<!-- Remplacer le formulaire actuel par : -->
<form @submit.prevent="detectSitemaps">
    <div class="form-group">
        <label for="sitemapUrl">URL du site web</label>
        <input
            type="url"
            id="sitemapUrl"
            v-model="sitemapUrl"
            placeholder="https://example.com"
            required
        >
        <p style="font-size: 12px; color: var(--gray-600); margin-top: 4px;">
            Entrez l'URL de votre site (pas du sitemap). Nous détecterons automatiquement le sitemap.
        </p>
    </div>

    <!-- Liste des sitemaps détectés (si plusieurs) -->
    <div v-if="detectedSitemaps.length > 1" class="form-group">
        <label>Sitemaps détectés :</label>
        <div v-for="sitemap in detectedSitemaps" :key="sitemap" style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; background: var(--gray-50); border-radius: 6px;">
                <input type="radio" name="sitemap" :value="sitemap" v-model="selectedSitemap">
                <span style="font-size: 13px; word-break: break-all;">{{ sitemap }}</span>
            </label>
        </div>
        <button
            type="button"
            @click="analyzeSitemap"
            class="btn btn-primary"
            :disabled="!selectedSitemap"
            style="margin-top: 12px;"
        >
            🔍 Analyser le sitemap sélectionné
        </button>
    </div>

    <button
        v-else
        type="submit"
        class="btn btn-primary"
        :disabled="detectingSitemap"
    >
        <span v-if="detectingSitemap" class="loading"></span>
        {{ detectingSitemap ? 'Détection...' : '🔍 Détecter et analyser' }}
    </button>
</form>
```

---

## 🎯 Défi #2 : Mindmap Optimisée pour 40+ Pages

### Solutions Proposées

#### Option A : Filtrage par Profondeur (Recommandé)
Permet de visualiser progressivement par niveaux de profondeur.

```javascript
// Ajouter au data :
maxDepthFilter: 3, // Afficher jusqu'à la profondeur 3
showAllNodes: false,

// Modifier initNetwork pour filtrer par profondeur :
initNetwork() {
    // ... code existant ...

    // Calculer la profondeur de chaque page
    const depths = this.calculateDepths();

    // Filtrer les nœuds selon maxDepthFilter
    const filteredNodes = Array.from(allUrls)
        .filter(url => {
            const depth = depths.get(url) || 0;
            return this.showAllNodes || depth <= this.maxDepthFilter;
        })
        .map(url => {
            // ... création du nœud ...
        });

    // Filtrer les edges également
    const filteredEdges = [];
    this.analysisResult.datas.internalLinks.forEach(page => {
        if ((depths.get(page.link) || 0) <= this.maxDepthFilter) {
            if (page.internalLinks) {
                page.internalLinks.forEach(link => {
                    if (!link.isCta && (depths.get(link.url) || 0) <= this.maxDepthFilter) {
                        filteredEdges.push({
                            from: page.link,
                            to: link.url,
                            arrows: 'to',
                            color: { color: '#999', highlight: '#FF6B6B' },
                            smooth: { type: 'curvedCW', roundness: 0.2 }
                        });
                    }
                });
            }
        }
    });
},

// Méthode helper pour calculer les profondeurs
calculateDepths() {
    const depths = new Map();
    const homepage = this.analysisResult.datas.internalLinks[0]?.link;

    if (!homepage) return depths;

    // BFS pour calculer les profondeurs
    const queue = [{ url: homepage, depth: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
        const { url, depth } = queue.shift();

        if (visited.has(url)) continue;
        visited.add(url);
        depths.set(url, depth);

        const page = this.analysisResult.datas.internalLinks.find(p => p.link === url);
        if (page && page.internalLinks) {
            page.internalLinks.forEach(link => {
                if (!link.isCta && !visited.has(link.url)) {
                    queue.push({ url: link.url, depth: depth + 1 });
                }
            });
        }
    }

    return depths;
}
```

#### HTML pour le filtre de profondeur :

```html
<div v-if="analysisResult.datas.internalLinks.length > 40" style="margin-bottom: 16px; padding: 16px; background: var(--gray-50); border-radius: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <strong>🎚️ Filtrer par profondeur</strong>
        <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" v-model="showAllNodes" @change="resetNetwork()">
            <span style="font-size: 13px;">Afficher tout</span>
        </label>
    </div>
    <div v-if="!showAllNodes">
        <input
            type="range"
            v-model.number="maxDepthFilter"
            min="1"
            max="5"
            step="1"
            @change="resetNetwork()"
            style="width: 100%;"
        >
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-600); margin-top: 4px;">
            <span>Profondeur 1</span>
            <span>Niveau {{ maxDepthFilter }}</span>
            <span>Profondeur 5</span>
        </div>
        <p style="font-size: 12px; color: var(--gray-600); margin-top: 8px;">
            Affichage des pages jusqu'à {{ maxDepthFilter }} clic(s) depuis l'accueil
        </p>
    </div>
</div>
```

#### Option B : Désactivation de la Physique après Stabilisation

```javascript
// Dans initNetwork, ajouter :
this.network.on('stabilizationIterationsDone', () => {
    this.network.setOptions({
        physics: {
            enabled: false // Fige le graphe
        }
    });
    logger.info('🎯 Mindmap stabilisée et figée');
});
```

#### Option C : Layout Hiérarchique pour Grands Sites

```javascript
// Remplacer les options de physics par un layout hiérarchique :
const options = {
    nodes: { borderWidth: 2 },
    edges: { width: 1, smooth: { type: 'cubicBezier' } },
    layout: {
        hierarchical: {
            enabled: true,
            direction: 'UD', // Up-Down (vertical)
            sortMethod: 'directed', // Respecte la direction des liens
            nodeSpacing: 150,
            levelSeparation: 200,
            treeSpacing: 250
        }
    },
    physics: {
        enabled: false // Pas besoin de physique avec layout hiérarchique
    },
    interaction: { hover: true, zoomView: true, dragView: true }
};
```

#### Option D : Clustering Automatique

```javascript
// Pour regrouper automatiquement les nœuds peu importants :
if (this.analysisResult.datas.internalLinks.length > 40) {
    // Activer le clustering pour les nœuds avec < 2 liens entrants
    data.nodes.get().forEach(node => {
        const incomingCount = incomingLinks.get(node.id) || 0;
        if (incomingCount < 2) {
            this.network.clustering.clusterByConnection(node.id, {
                clusterNodeProperties: {
                    label: `${incomingCount} pages`,
                    shape: 'database',
                    color: '#ccc'
                }
            });
        }
    });
}
```

---

## 📋 Recommandations Finales

**Pour sites < 40 pages** : Layout force-directed actuel (performant et visuel)

**Pour sites 40-100 pages** :
1. Filtrage par profondeur (Option A) ✅
2. Désactivation physique après stabilisation (Option B) ✅

**Pour sites > 100 pages** :
1. Layout hiérarchique (Option C) ✅
2. OU Filtrage par profondeur + clustering (Options A + D) ✅

### Implémentation Progressive

```javascript
// Choix automatique du mode selon le nombre de pages :
initNetwork() {
    const pageCount = this.analysisResult.datas.internalLinks.length;
    let options;

    if (pageCount <= 40) {
        // Mode force-directed (actuel)
        options = {
            physics: {
                barnesHut: {
                    gravitationalConstant: -2000,
                    springLength: 150
                }
            }
        };
    } else if (pageCount <= 100) {
        // Mode filtré + freeze
        options = {
            physics: {
                barnesHut: { gravitationalConstant: -3000 }
            }
        };
        // Figer après 5 secondes
        setTimeout(() => {
            this.network.setOptions({ physics: { enabled: false } });
        }, 5000);
    } else {
        // Mode hiérarchique
        options = {
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD',
                    nodeSpacing: 120,
                    levelSeparation: 150
                }
            },
            physics: { enabled: false }
        };
    }

    this.network = new vis.Network(container, data, options);
}
```

