FROM eclipse-temurin:18-jdk AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test

FROM eclipse-temurin:18-jdk
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 31000
ENTRYPOINT ["java", "-jar", "app.jar"]