-- ============================================
-- AGRO-BACKEND DATABASE SCHEMA
-- ============================================

-- Пользователи (фермеры/агрономы)
CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     email VARCHAR(255) UNIQUE NOT NULL,
                                     name VARCHAR(255) NOT NULL,
                                     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Сельскохозяйственные поля
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(10,2) NOT NULL CHECK (area_hectares > 0),
    crop_type VARCHAR(100),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Данные с датчиков
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    soil_moisture DECIMAL(5,2) NOT NULL CHECK (soil_moisture >= 0 AND soil_moisture <= 100),
    temperature DECIMAL(5,2) NOT NULL CHECK (temperature >= -50 AND temperature <= 60),
    humidity DECIMAL(5,2) NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Прогнозы урожайности и полива
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    yield_prediction DECIMAL(10,2),
    irrigation_recommendation DECIMAL(10,2),
    confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 1),
    is_anomaly BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Уведомления и предупреждения
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'critical')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_fields_user_id ON fields(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_field_id ON sensor_data(field_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_field_id ON predictions(field_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- ============================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- ============================================

INSERT INTO users (email, name) VALUES
    ('farmer@example.com', 'Иван Петров'),
    ('agro@company.com', 'ООО Агро')
ON CONFLICT (email) DO NOTHING;