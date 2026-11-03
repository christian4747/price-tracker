package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Period;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface PeriodDAO extends JpaRepository<Period, Integer> {

    /**
     * Finds all Periods with the given name, ignoring case, whether they are soft deleted.
     * @param name Name of the Periods to find
     * @return A list of all the Periods with the given name
     */
    List<Period> findAllByNameIgnoreCase(String name);

    /**
     * Finds the non-deleted Periods for the given store, along with the Periods for all stores. Current and upcoming
     * Periods come first, soonest start first, then past Periods, most recently ended first.
     * @param store Store of the Periods to find, or null for every store's Periods
     * @param now The time that decides which Periods have ended
     * @return A list of the store's Periods
     */
    @Query(value = """
        SELECT p FROM Period p
        WHERE p.deletedAt IS NULL
        AND (:store IS NULL OR p.store = :store OR p.store IS NULL)
        ORDER BY CASE WHEN p.periodEnded > :now THEN p.periodStarted END NULLS LAST,
            p.periodEnded DESC,
            p.periodId
        """)
    List<Period> findAllForStore(@Param("store") String store, @Param("now") Timestamp now);

    /**
     * Permanently removes a soft deleted Period from the 'periods' database table. A query is needed because deleting
     * through the entity is a soft delete.
     * @param periodId ID of the Period to remove
     * @return The number of removed Periods
     */
    @Modifying
    @Query(value = "DELETE FROM Period p WHERE p.periodId = :periodId AND p.deletedAt IS NOT NULL")
    int permanentlyDeleteById(@Param("periodId") Integer periodId);
}
