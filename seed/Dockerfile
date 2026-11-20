FROM --platform=$BUILDPLATFORM golang:1.27.4-alpine@sha256:70bd7ddea8b6cbe5d6943cde279d6b67feb10cc924fb9100d1d8757c1575b280 AS builder
WORKDIR /app
ARG TARGETOS
ARG TARGETARCH
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -trimpath -buildvcs=false -ldflags="-w -s" -o seed main.go

FROM alpine:3.24
RUN apk --no-cache upgrade && apk --no-cache add ca-certificates
WORKDIR /app
RUN addgroup -S seed && adduser -S seed -G seed
COPY --from=builder --chown=seed:seed /app/seed /app/seed
USER seed
CMD ["/app/seed"]
