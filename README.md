# price-tracker
[![Java CI with Maven](https://github.com/christian4747/price-tracker/actions/workflows/maven.yml/badge.svg)](https://github.com/christian4747/price-tracker/actions/workflows/maven.yml)  
[![Frontend CI](https://github.com/christian4747/price-tracker/actions/workflows/frontend.yml/badge.svg)](https://github.com/christian4747/price-tracker/actions/workflows/frontend.yml)
  
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

## Dummy data
To fill a local database with about three years of made-up products, prices, and sale and return periods, start the backend with the `seed` profile alongside your usual one (for example `dev,seed`), then run:

```bash
curl -X POST http://localhost:7777/api/dev/seed
```

Dates are counted from the day you run it, so the same day always gives the same data, and a price live today stays live however long after you first seeded. Running it again permanently removes the seed's own records (products matching a seed product's name and store, and periods matching a seed period's name) and adds them again with new IDs. Records you added yourself are left alone. The data is in `DevSeedData`.

The endpoint only exists with the `seed` profile, and never with `prod`.
