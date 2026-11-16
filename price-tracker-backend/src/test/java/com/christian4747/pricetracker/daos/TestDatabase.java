package com.christian4747.pricetracker.daos;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.boot.test.context.TestComponent;

import java.sql.Timestamp;

/**
 * Helpers shared by the database tests, which can autowire it since {@link DatabaseTest} imports it.
 */
@TestComponent
public class TestDatabase {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Writes the test's entities to the database and forgets them, so the code under test reads them back from the
     * database rather than getting the same objects from Hibernate's cache.
     */
    public void saveFixtures() {
        entityManager.flush();
        entityManager.clear();
    }

    /**
     * Sets when an entity was created. createdAt is set automatically on insert, so a fixed value has to be written
     * afterwards with an update.
     * @param entity A product or price the test has persisted
     * @param createdAt The creation time to store
     */
    public void setCreatedAt(Object entity, Timestamp createdAt) {
        entityManager.flush();
        String entityName = entityManager.getMetamodel().entity(entity.getClass()).getName();
        entityManager.createQuery("UPDATE " + entityName + " e SET e.createdAt = :createdAt WHERE e = :entity")
                .setParameter("createdAt", createdAt)
                .setParameter("entity", entity)
                .executeUpdate();
    }
}
