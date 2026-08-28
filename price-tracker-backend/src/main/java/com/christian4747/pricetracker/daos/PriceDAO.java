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
     * Gets a distinct list of recently added Price currencies.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price currencies (default 20)
     */
    @Query(value = "SELECT p.currency FROM Price p WHERE p.priceId IN (SELECT MIN(p.priceId) FROM Price p WHERE p.currency <> '' GROUP BY p.currency)")
    Page<String> findDistinctCurrency(Pageable pageable);

    /**
     * Gets a distinct list of recently added Price priceStarted time stamps.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price priceStarted time stamps (default 20)
     */
    @Query(value = "SELECT p.priceStarted FROM Price p WHERE p.priceId IN (SELECT MIN(p.priceId) FROM Price p GROUP BY p.priceStarted) ORDER BY p.createdAt DESC")
    Page<Timestamp> findDistinctPriceStartedOrderByCreatedAtDesc(Pageable pageable);
}
