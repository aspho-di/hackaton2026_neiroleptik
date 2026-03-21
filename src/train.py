import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score

from preprocess import prepare_features


def train_model(dataset_path: str = "../data/processed/dataset.csv"):
    df = pd.read_csv(dataset_path)
    X, y = prepare_features(df)

    print(f"Датасет: {len(df)} строк, {X.shape[1]} фичей")

    # Если данных мало — используем кросс-валидацию вместо сплита
    if len(df) < 15:
        print("⚠️  Мало данных — используем cross-validation")
        model = XGBRegressor(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=42
        )
        scores = cross_val_score(model, X, y, cv=3, scoring="neg_mean_absolute_error")
        print(f"MAE (кросс-вал): {-scores.mean():.2f} ± {scores.std():.2f} ц/га")
        model.fit(X, y)
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        model = XGBRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        print(f"MAE: {mae:.2f} ц/га")
        print(f"R²:  {r2:.3f}")

    # Важность фичей
    feature_importance = pd.Series(
        model.feature_importances_,
        index=X.columns
    ).sort_values(ascending=False)
    print("\nВажность фичей:")
    print(feature_importance)

    # Сохраняем модель
    joblib.dump(model, "../models/yield_model.pkl")
    print("\n✅ Модель сохранена → models/yield_model.pkl")

    return model


if __name__ == "__main__":
    train_model()
