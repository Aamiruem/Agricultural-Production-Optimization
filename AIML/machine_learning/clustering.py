"""Unsupervised learning: discover agro-climatic zones from soil & climate readings.

* K-Means with the elbow method and silhouette score to choose k
* DBSCAN (density-based; finds outliers) and Agglomerative (hierarchical)
* Dimensionality reduction: PCA (linear) and t-SNE (non-linear) for 2-D plots
* Each cluster is described by its dominant crops (cluster → crop purity)

    python -m AIML.machine_learning.clustering
"""
from __future__ import annotations

import json

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from sklearn.cluster import DBSCAN, AgglomerativeClustering, KMeans  # noqa: E402
from sklearn.decomposition import PCA  # noqa: E402
from sklearn.manifold import TSNE  # noqa: E402
from sklearn.metrics import adjusted_rand_score, silhouette_score  # noqa: E402
from sklearn.preprocessing import StandardScaler  # noqa: E402

from AIML.config import DATA_PATH, FEATURES, RANDOM_STATE, REPORTS_DIR  # noqa: E402


def choose_k(X: np.ndarray, ks=range(4, 16)) -> tuple[int, dict]:  # k=2,3 only split off apple/grapes
    scores = {}
    for k in ks:
        km = KMeans(n_clusters=k, n_init=10, random_state=RANDOM_STATE).fit(X)
        scores[k] = {"inertia": float(km.inertia_), "silhouette": float(silhouette_score(X, km.labels_))}
    best = max(scores, key=lambda k: scores[k]["silhouette"])
    return best, scores


def describe_clusters(df: pd.DataFrame, labels: np.ndarray) -> list[dict]:
    out = []
    for c in sorted(set(labels)):
        part = df[labels == c]
        top = part["label"].value_counts(normalize=True).head(3)
        out.append({
            "cluster": int(c), "size": len(part),
            "top_crops": {k: round(float(v), 2) for k, v in top.items()},
            "profile": part[FEATURES].mean().round(1).to_dict(),
        })
    return out


def main() -> dict:
    df = pd.read_csv(DATA_PATH)
    X = StandardScaler().fit_transform(df[FEATURES])

    k, scores = choose_k(X)
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=RANDOM_STATE).fit(X)
    agglo = AgglomerativeClustering(n_clusters=k, linkage="ward").fit(X)
    dbscan = DBSCAN(eps=1.2, min_samples=10).fit(X)

    pca = PCA(n_components=2, random_state=RANDOM_STATE).fit(X)
    pcs = pca.transform(X)
    tsne = TSNE(n_components=2, perplexity=40, random_state=RANDOM_STATE, init="pca").fit_transform(X)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    for ax, emb, title in ((axes[0], pcs, "PCA"), (axes[1], tsne, "t-SNE")):
        ax.scatter(emb[:, 0], emb[:, 1], c=kmeans.labels_, cmap="tab10", s=6)
        ax.set_title(f"K-Means (k={k}) zones — {title}")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "clusters.png", dpi=110)
    plt.close(fig)

    result = {
        "chosen_k": k,
        "k_scores": scores,
        "pca_explained_variance": pca.explained_variance_ratio_.round(3).tolist(),
        "agreement_kmeans_vs_agglomerative_ARI": float(adjusted_rand_score(kmeans.labels_, agglo.labels_)),
        "dbscan_clusters": int(len(set(dbscan.labels_)) - (1 if -1 in dbscan.labels_ else 0)),
        "dbscan_noise_points": int((dbscan.labels_ == -1).sum()),
        "zones": describe_clusters(df, kmeans.labels_),
    }
    (REPORTS_DIR / "clusters.json").write_text(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    r = main()
    print(f"k={r['chosen_k']}, ARI(kmeans, agglomerative)={r['agreement_kmeans_vs_agglomerative_ARI']:.2f}")
    for z in r["zones"]:
        print(z["cluster"], z["size"], z["top_crops"])
