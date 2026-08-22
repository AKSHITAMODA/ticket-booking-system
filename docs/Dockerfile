# ================================
# Stage 1: Build Spring Boot app
# ================================
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy backend project
COPY backend/pom.xml ./backend/pom.xml

# Download dependencies first for better Docker caching
RUN cd backend && mvn dependency:go-offline -B

# Copy source code
COPY backend ./backend

# Build the application
RUN cd backend && mvn clean package -DskipTests


# ================================
# Stage 2: Run Spring Boot app
# ================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy generated JAR
COPY --from=builder /app/backend/target/*.jar app.jar

# Render provides the PORT environment variable
EXPOSE 8080

# Start Spring Boot
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-8080}"]