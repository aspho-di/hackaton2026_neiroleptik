package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

var mlClient = &http.Client{Timeout: 30 * time.Second}

func mlHost1() string {
	h := os.Getenv("ML_SERVICE_1_URL")
	if h == "" {
		return "http://localhost:8001"
	}
	return h
}

func mlHost2() string {
	h := os.Getenv("ML_SERVICE_2_URL")
	if h == "" {
		return "http://localhost:8002"
	}
	return h
}

// GetDistricts godoc
// @Summary      Список районов
// @Description  Возвращает список доступных районов из ML сервиса урожайности
// @Tags         ml
// @Produce      json
// @Success      200  {array}   map[string]string
// @Failure      502  {object}  map[string]string
// @Router       /api/v1/districts [get]
func GetDistricts(w http.ResponseWriter, r *http.Request) {
	proxyGet(w, mlHost1()+"/districts")
}

// GetForecast godoc
// @Summary      Прогноз урожайности
// @Description  Прогноз урожайности по району
// @Tags         ml
// @Produce      json
// @Param        district  query     string  true  "Район (например: salsk)"
// @Success      200       {object}  map[string]interface{}
// @Failure      502       {object}  map[string]string
// @Router       /api/v1/predict/forecast [get]
func GetForecast(w http.ResponseWriter, r *http.Request) {
	proxyGet(w, fmt.Sprintf("%s/predict/forecast?%s", mlHost1(), r.URL.RawQuery))
}

// PredictManual godoc
// @Summary      Ручной прогноз урожайности
// @Description  Прогноз урожайности по вручную введённым погодным данным
// @Tags         ml
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      502  {object}  map[string]string
// @Router       /api/v1/predict/manual [post]
func PredictManual(w http.ResponseWriter, r *http.Request) {
	proxyPost(w, r, mlHost1()+"/predict/manual")
}

// RecommendIrrigation godoc
// @Summary      Рекомендация по поливу
// @Description  Рекомендация по поливу от ML сервиса
// @Tags         ml
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      502  {object}  map[string]string
// @Router       /api/v1/recommend/irrigation [post]
func RecommendIrrigation(w http.ResponseWriter, r *http.Request) {
	proxyPost(w, r, mlHost2()+"/recommend/irrigation")
}

// ValidateData godoc
// @Summary      Валидация данных
// @Description  Валидация входных данных через ML сервис
// @Tags         ml
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      502  {object}  map[string]string
// @Router       /api/v1/validate [post]
func ValidateData(w http.ResponseWriter, r *http.Request) {
	proxyPost(w, r, mlHost2()+"/validate")
}

// GetConfigProfiles godoc
// @Summary      Профили конфигурации
// @Description  Возвращает профили конфигурации из ML сервиса полива
// @Tags         ml
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      502  {object}  map[string]string
// @Router       /api/v1/config/profiles [get]
func GetConfigProfiles(w http.ResponseWriter, r *http.Request) {
	proxyGet(w, mlHost2()+"/config/profiles")
}

// MLHealthHandler godoc
// @Summary      ML сервисы health check
// @Description  Проверяет доступность обоих ML сервисов
// @Tags         ml
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /api/v1/ml/health [get]
func MLHealthHandler(w http.ResponseWriter, r *http.Request) {
	svc1 := pingML(mlHost1() + "/docs")
	svc2 := pingML(mlHost2() + "/docs")

	status := "ok"
	httpStatus := http.StatusOK
	if !svc1 || !svc2 {
		status = "degraded"
		httpStatus = http.StatusOK // не 503 — просто показываем статус
	}

	respondJSON(w, httpStatus, map[string]interface{}{
		"status":                status,
		"ml_yield_service":      boolToStatus(svc1),
		"ml_irrigation_service": boolToStatus(svc2),
	})
}

// --- вспомогательные функции ---

func proxyGet(w http.ResponseWriter, url string) {
	resp, err := mlClient.Get(url)
	if err != nil {
		respondError(w, http.StatusBadGateway, fmt.Sprintf("ML service unavailable: %v", err))
		return
	}
	defer resp.Body.Close()
	copyResponse(w, resp)
}

func proxyPost(w http.ResponseWriter, r *http.Request, url string) {
	req, err := http.NewRequest(http.MethodPost, url, r.Body)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := mlClient.Do(req)
	if err != nil {
		respondError(w, http.StatusBadGateway, fmt.Sprintf("ML service unavailable: %v", err))
		return
	}
	defer resp.Body.Close()
	copyResponse(w, resp)
}

func copyResponse(w http.ResponseWriter, resp *http.Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func pingML(url string) bool {
	resp, err := mlClient.Get(url)
	if err != nil {
		return false
	}
	resp.Body.Close()
	return resp.StatusCode < 500
}
