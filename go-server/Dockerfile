# Use the official Go image
FROM golang:1.25.5-alpine3.23

# Set the working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source from the current directory to the working Directory inside the container
COPY . .

# Copy config file
COPY config.yaml config.yaml

# Build the Go app
RUN go build -o my-go-server .

# Expose port 3000
EXPOSE 3000

# Command to run the executable
CMD ["./my-go-server"]
