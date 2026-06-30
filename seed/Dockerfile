FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS builder
WORKDIR /app
ARG TARGETOS
ARG TARGETARCH
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags="-w -s" -o seed main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/seed /app/seed
CMD ["/app/seed"]
