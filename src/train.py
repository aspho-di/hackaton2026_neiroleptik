import pandas as pd
import numpy as np
import joblib
import argparse
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score, LeaveOneOut, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report

from preprocess import prepare_features, YIELD_THRESHOLD


def train_model(dataset_path: str = "../data/processed/dataset.csv"):
    df = pd.read_csv(dataset_path)

    # Если порог не задан — считаем из данных
    if "yield_actual" not in df.columns:
        threshold = df["yield_centner_per_ha"].median()
        df["yield_actual"] = (df["yield_centner_per_ha"] >= threshold).astype(int)

    X, y = prepare_features(df)

    print(f"Датасет: {len(df)} строк, {X.shape[1]} фичей")
    print(f"Распределение: {y.value_counts().to_dict()}")

    model = XGBClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        subsample=0.8,
        eval_metric="logloss",
        random_state=42
    )

    # === КОЭФФИЦИЕНТ ОБУЧЕННОСТИ ===
    if len(df) < 30:
        print("\n⚠️  Мало данных — используем Leave-One-Out Cross-Validation")
        loo = LeaveOneOut()
        cv_scores = cross_val_score(model, X, y, cv=loo, scoring="accuracy")
    else:
        print("\nИспользуем Stratified 5-Fold Cross-Validation")
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=skf, scoring="accuracy")

    cv_accuracy = cv_scores.mean()
    print(f"Коэффициент обученности XGBoost (CV Accuracy): {cv_accuracy:.3f} ±{cv_scores.std():.3f}")

    # Финальное обучение
    model.fit(X, y)

    y_pred_train = model.predict(X)
    train_acc = accuracy_score(y, y_pred_train)
    print(f"Train Accuracy: {train_acc:.3f}")
    print(f"CV Accuracy:    {cv_accuracy:.3f}")

    print("\nОтчёт классификации (train):")
    print(classification_report(y, y_pred_train,
          target_names=["Низкий урожай (0)", "Хороший урожай (1)"],
          zero_division=0))

    feature_importance = pd.Series(
        model.feature_importances_, index=X.columns
    ).sort_values(ascending=False)
    print("Важность фичей:")
    print(feature_importance.round(4))

    threshold = df["yield_centner_per_ha"].median() if "yield_centner_per_ha" in df.columns else YIELD_THRESHOLD

    joblib.dump({
        "model": model,
        "threshold": threshold,
        "features": list(X.columns),
        "cv_accuracy": round(float(cv_accuracy), 4),
        "train_accuracy": round(float(train_acc), 4),
    }, "../models/yield_model.pkl")

    print(f"\n✅ Модель сохранена → models/yield_model.pkl")
    print(f"   Коэффициент обученности: {cv_accuracy:.3f} ({cv_accuracy*100:.1f}%)")

    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="../data/processed/dataset.csv",
                        help="Путь к датасету")
    args = parser.parse_args()
    train_model(args.dataset)