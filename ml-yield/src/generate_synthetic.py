import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score

# ============================================================
# Загружаем реальный датасет
# ============================================================
df_real = pd.read_csv("../data/processed/dataset.csv")

FEATURE_COLS = [
    "temp_mean", "temp_max", "temp_min",
    "precip_total", "precip_days",
    "wind_max", "evapotranspiration",
    "hot_days", "dry_days", "water_balance"
]

# Порог = медиана реальных данных
threshold = df_real["yield_centner_per_ha"].median()
df_real["yield_actual"] = (df_real["yield_centner_per_ha"] >= threshold).astype(int)

print(f"Реальных данных: {len(df_real)} строк")
print(f"Порог урожайности: {threshold:.2f} ц/га")

# ============================================================
# ПОДХОД 1: Синтетика на основе статистики (Gaussian Copula)
# ============================================================
def generate_statistical(df, n=500, seed=42):
    np.random.seed(seed)
    synthetic_rows = []

    for cls in [0, 1]:
        subset = df[df["yield_actual"] == cls][FEATURE_COLS]
        n_cls = n // 2

        mean = subset.mean()
        cov = subset.cov()

        # Добавляем небольшой шум к диагонали для стабильности
        cov += np.eye(len(FEATURE_COLS)) * 1e-6

        samples = np.random.multivariate_normal(mean.values, cov.values, n_cls)
        samples_df = pd.DataFrame(samples, columns=FEATURE_COLS)

        # Физические ограничения
        samples_df["precip_total"] = samples_df["precip_total"].clip(0, 600)
        samples_df["precip_days"] = samples_df["precip_days"].clip(0, 92).round()
        samples_df["hot_days"] = samples_df["hot_days"].clip(0, 92).round()
        samples_df["dry_days"] = samples_df["dry_days"].clip(0, 92).round()
        samples_df["wind_max"] = samples_df["wind_max"].clip(0, 80)
        samples_df["evapotranspiration"] = samples_df["evapotranspiration"].clip(100, 1200)
        samples_df["humidity_pct"] = np.random.uniform(30, 80, n_cls)  # доп. поле
        samples_df["yield_actual"] = cls

        synthetic_rows.append(samples_df)

    return pd.concat(synthetic_rows, ignore_index=True)


# ============================================================
# ПОДХОД 2: SMOTE-подобный (интерполяция между соседями)
# ============================================================
def generate_smote_like(df, n=500, seed=42):
    np.random.seed(seed)
    synthetic_rows = []

    for cls in [0, 1]:
        subset = df[df["yield_actual"] == cls][FEATURE_COLS].values
        n_cls = n // 2
        generated = []

        for _ in range(n_cls):
            # Берём случайную точку
            idx = np.random.randint(0, len(subset))
            point = subset[idx]

            # Берём случайного соседа
            neighbor_idx = np.random.randint(0, len(subset))
            neighbor = subset[neighbor_idx]

            # Интерполируем
            alpha = np.random.uniform(0, 1)
            new_point = point + alpha * (neighbor - point)

            # Добавляем небольшой шум
            noise = np.random.normal(0, 0.05, len(new_point))
            new_point = new_point + noise * np.abs(new_point)

            generated.append(new_point)

        gen_df = pd.DataFrame(generated, columns=FEATURE_COLS)
        gen_df["precip_total"] = gen_df["precip_total"].clip(0, 600)
        gen_df["precip_days"] = gen_df["precip_days"].clip(0, 92).round()
        gen_df["hot_days"] = gen_df["hot_days"].clip(0, 92).round()
        gen_df["dry_days"] = gen_df["dry_days"].clip(0, 92).round()
        gen_df["wind_max"] = gen_df["wind_max"].clip(0, 80)
        gen_df["evapotranspiration"] = gen_df["evapotranspiration"].clip(100, 1200)
        gen_df["yield_actual"] = cls

        synthetic_rows.append(gen_df)

    return pd.concat(synthetic_rows, ignore_index=True)


# ============================================================
# Сравниваем оба подхода
# ============================================================
def eval_approach(name, df_synth, df_real):
    X_synth = df_synth[FEATURE_COLS]
    y_synth = df_synth["yield_actual"]

    model = GradientBoostingClassifier(n_estimators=100, max_depth=3,
                                        learning_rate=0.1, random_state=42)

    # CV на синтетике
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_synth, y_synth, cv=skf, scoring="accuracy")

    # Обучаем на синтетике, проверяем на реальных
    model.fit(X_synth, y_synth)
    X_real = df_real[FEATURE_COLS]
    y_real = df_real["yield_actual"]
    real_acc = accuracy_score(y_real, model.predict(X_real))

    print(f"\n{name}:")
    print(f"  CV Accuracy (синтетика): {cv_scores.mean():.3f} ±{cv_scores.std():.3f}")
    print(f"  Accuracy на реальных данных: {real_acc:.3f}")
    return cv_scores.mean(), real_acc, model


print("\n=== СРАВНЕНИЕ ПОДХОДОВ ===")

df_stat = generate_statistical(df_real, n=500)
score_stat, real_stat, model_stat = eval_approach("Статистика (Gaussian)", df_stat, df_real)

df_smote = generate_smote_like(df_real, n=500)
score_smote, real_smote, model_smote = eval_approach("SMOTE-подобный", df_smote, df_real)

# ============================================================
# Выбираем лучший и сохраняем
# ============================================================
print("\n=== РЕЗУЛЬТАТ ===")
if real_stat >= real_smote:
    best_df = df_stat
    best_name = "Gaussian"
    best_real = real_stat
    best_cv = score_stat
else:
    best_df = df_smote
    best_name = "SMOTE-подобный"
    best_real = real_smote
    best_cv = score_smote

# Добавляем реальные данные к синтетике
df_combined = pd.concat([
    df_real[FEATURE_COLS + ["yield_actual"]],
    best_df[FEATURE_COLS + ["yield_actual"]]
], ignore_index=True)

df_combined.to_csv("../data/processed/dataset_augmented.csv", index=False)

print(f"Победитель: {best_name}")
print(f"CV Accuracy: {best_cv:.3f}")
print(f"Accuracy на реальных данных: {best_real:.3f}")
print(f"\nИтоговый датасет: {len(df_combined)} строк")
print(f"Сохранён → data/processed/dataset_augmented.csv")
print(f"\nЧтобы обучить на расширенном датасете, запусти:")
print(f"  python train.py --dataset ../data/processed/dataset_augmented.csv")