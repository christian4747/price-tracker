package com.christian4747.pricetracker.daos;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class DatabaseSetupTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    void migrationsApplyAndMatchTheEntities() {
        Number appliedMigrations = (Number) entityManager
                .createNativeQuery("SELECT count(*) FROM price_tracker_test.flyway_schema_history")
                .getSingleResult();

        assertThat(appliedMigrations.longValue()).isPositive();
    }
}
