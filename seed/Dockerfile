FROM --platform=$BUILDPLATFORM golang:1.26.6-alpine AS builder
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
