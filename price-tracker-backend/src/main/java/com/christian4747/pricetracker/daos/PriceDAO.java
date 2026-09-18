package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;

@Repository
public interface PriceDAO extends JpaRepository<Price, Integer> {

    /**
     * Finds prices whose deletedAt is null (not deleted).
     * @param pageable Pagination settings
     * @return Prices whose deletedAt is not null (not deleted)
     */
    Page<Price> findByDeletedAtNull(Pageable pageable);

    /**
     * Gets a distinct list of recently added non-deleted Price currencies.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price currencies (default 20)
     */
    @Query(value = "SELECT p.currency FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.currency <> '' AND p.deletedAt IS NULL GROUP BY p.currency)")
    Page<String> findDistinctCurrency(Pageable pageable);

    /**
     * Gets a distinct list of recently added non-deleted Price descriptions.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price descriptions (default 20)
     */
    @Query(value = "SELECT p.description FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.description <> '' AND p.deletedAt IS NULL GROUP BY p.description) ORDER BY p.createdAt DESC")
    Page<String> findDistinctDescription(Pageable pageable);

    /**
     * Gets a distinct list of recently added non-deleted Price priceEnded time stamps.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price priceEnded time stamps (default 20)
     */
    @Query(value = "SELECT p.priceEnded FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.priceEnded IS NOT NULL AND p.deletedAt IS NULL GROUP BY p.priceEnded) ORDER BY p.createdAt DESC")
    Page<Timestamp> findDistinctPriceEndedOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Gets a distinct list of recently added non-deleted Price priceStarted time stamps.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price priceStarted time stamps (default 20)
     */
    @Query(value = "SELECT p.priceStarted FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.deletedAt IS NULL GROUP BY p.priceStarted) ORDER BY p.createdAt DESC")
    Page<Timestamp> findDistinctPriceStartedOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Gets a list of Prices in the 'prices' database table with the given productId ordered by descending price started
     * timestamp that are not deleted.
     * @param pageable Pagination settings
     * @param productId productId of the Prices to get
     * @return The Prices associated with the given productId
     */
    @Query(value = "SELECT p FROM Price p WHERE p.product.productId = :productId AND p.deletedAt IS NULL ORDER BY p.priceStarted DESC")
    Page<Price> findByProductProductIdOrderByPriceStartedDesc(Pageable pageable, @Param("productId") Integer productId);

    /**
     * Gets a list of Prices in the 'prices' database table with the given productId ordered by descending price started
     * timestamp (includes deleted prices).
     * @param pageable Pagination settings
     * @param productId productId of the Prices to get
     * @return The Prices associated with the given productId
     */
    @Query(value = "SELECT p FROM Price p WHERE p.product.productId = :productId ORDER BY p.priceStarted DESC")
    Page<Price> findByProductProductIdOrderByPriceStartedDescDeleted(Pageable pageable, @Param("productId") Integer productId);

    /**
     * Gets the closest Price before today with the given productId that is not deleted.
     * @param productId productId of the Price to get
     * @return The closest Price before today with the given productId
     */
    @Query(value = "SELECT p FROM Price p WHERE p.priceStarted <= CURRENT_TIMESTAMP AND p.product.productId = :productId AND p.deletedAt IS NULL ORDER BY p.priceStarted DESC LIMIT 1")
    Optional<Price> findPriceToday(@Param("productId") Integer productId);

    /**
     * Gets the next Price after today with the given productId that is not deleted.
     * @param productId productId of the Price to get
     * @return The next Price after today with the given productId
     */
    @Query(value = "SELECT p FROM Price p WHERE p.priceStarted > CURRENT_TIMESTAMP AND p.product.productId = :productId AND p.deletedAt IS NULL ORDER BY p.priceStarted LIMIT 1")
    Optional<Price> findNextPriceAfterToday(@Param("productId") Integer productId);

    /**
     * Gets the latest updatedAt Price for the given productId that is not deleted.
     * @param productId productId of the Price to get
     * @return The latest updatedAt Price for the given productId
     */
    @Query(value = "SELECT p.updatedAt FROM Price p WHERE p.product.productId = :productId AND p.deletedAt IS NULL ORDER BY p.updatedAt DESC LIMIT 1")
    Optional<Timestamp> findLastUpdated(@Param("productId") Integer productId);

    /**
     * Gets the number of Price(s) for the given productId that are not deleted.
     * @param productId productId of the Price(s) to get
     * @return The number of Price(s) for the given productId.
     */
    @Query(value = "SELECT COUNT(*) FROM Price p WHERE p.product.productId = :productId AND p.deletedAt IS NULL")
    Integer findPriceCount(@Param("productId") Integer productId);

    /**
     * Gets the one-year, two-year, and all-time low percentages of the given productId's Price(s) that are not deleted.
     * @param productId The productId to get percentages for
     * @param oneYearAgo The date one year ago
     * @param twoYearsAgo The date two years ago
     * @return The one-year, two-year, and all-time low percentages of the given productId's Price(s)
     */
    @Query(value = """
        SELECT
        	(SELECT MAX(p.totalPercentage) FROM Price p WHERE p.priceStarted >= :oneYearAgo AND p.product.productId = :productId AND p.deletedAt IS NULL) AS oneYearLow,
        	(SELECT MAX(p.totalPercentage) FROM Price p WHERE p.priceStarted >= :twoYearsAgo AND p.product.productId = :productId AND p.deletedAt IS NULL) AS twoYearLow,
        	(SELECT MAX(p.totalPercentage) FROM Price p WHERE p.product.productId = :productId AND p.deletedAt IS NULL) AS allTimeLow
    """)
    Optional<PriceTotalPercentages> findPriceTotalPercentages(@Param("productId") Integer productId, Timestamp oneYearAgo, Timestamp twoYearsAgo);
}
