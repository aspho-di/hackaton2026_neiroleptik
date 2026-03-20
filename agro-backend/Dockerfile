# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Собираем в /app/bin/main
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o bin/main ./cmd/main.go

# Stage 2: Run
FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

# Копируем бинарник из правильного пути
COPY --from=builder /app/bin/main ./bin/main

# Копируем mocks если есть (не критично)
COPY --from=builder /app/mocks ./mocks

EXPOSE 8080

# Запускаем из правильного пути
CMD ["./bin/main"]