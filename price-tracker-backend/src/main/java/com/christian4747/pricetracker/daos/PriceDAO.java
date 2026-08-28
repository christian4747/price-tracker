package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;

@Repository
public interface PriceDAO extends JpaRepository<Price, Integer> {

    /**
     * Find distinct Prices by added descending in the database's 'prices' table.
     * @param page Pagination settings
     * @return The list of Prices ordered by added descending
     */
    @Query(value = "SELECT p.priceStarted FROM Price p WHERE p.priceId IN (SELECT MIN(p.priceId) FROM Price p GROUP BY p.priceStarted) ORDER BY p.createdAt DESC")
    Page<Timestamp> findDistinctPriceStartedOrderByCreatedAtDesc(Pageable page);
}
