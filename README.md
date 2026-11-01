# price-tracker
[![Java CI with Maven](https://github.com/christian4747/price-tracker/actions/workflows/maven.yml/badge.svg)](https://github.com/christian4747/price-tracker/actions/workflows/maven.yml)  
  
A simple full stack web application for locally tracking price history.

<img width="1349" height="911" alt="price-tracker" src="https://github.com/user-attachments/assets/5aaee967-b395-4422-a2c7-3ac73903b98d" />

## Backend tests
Run these from `price-tracker-backend`. The backend needs Java 25.

```bash
./mvnw test
```

Tests marked `@DatabaseTest` run against a throwaway Postgres container, so they need Docker running. They don't touch your own database, and they only run with the `database-tests` profile, which CI also uses:

```bash
./mvnw test -Pdatabase-tests
```
