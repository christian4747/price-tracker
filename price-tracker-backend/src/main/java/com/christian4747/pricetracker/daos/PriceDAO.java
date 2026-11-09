package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PricePeriod;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.StartedPrice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceDAO extends JpaRepository<Price, Integer>, JpaSpecificationExecutor<Price> {

    /**
     * Finds prices whose deletedAt is null (not deleted).
     * @param pageable Pagination settings
     * @return Prices whose deletedAt is not null (not deleted)
     */
    Page<Price> findByDeletedAtNull(Pageable pageable);

    /**
     * Counts all the Prices of the given productId, whether or not they are soft deleted.
     * @param productId productId of the Prices to count
     * @return The number of Prices
     */
    long countByProductProductId(Integer productId);

    /**
     * Restores the Prices of the given productId that were deleted at the given time. Deleting a Product deletes its
     * Prices in the same transaction, so they share the Product's deletedAt.
     * @param productId productId of the Prices to restore
     * @param deletedAt The deletedAt of the Prices to restore
     * @return The number of restored Prices
     */
    @Modifying
    @Query(value = "UPDATE Price p SET p.deletedAt = NULL WHERE p.product.productId = :productId AND p.deletedAt = :deletedAt")
    int restoreByProductIdAndDeletedAt(@Param("productId") Integer productId, @Param("deletedAt") Timestamp deletedAt);

    /**
     * Permanently removes a soft deleted Price from the 'prices' database table. A query is needed because deleting
     * through the entity is a soft delete.
     * @param priceId ID of the Price to remove
     * @return The number of removed Prices
     */
    @Modifying
    @Query(value = "DELETE FROM Price p WHERE p.priceId = :priceId AND p.deletedAt IS NOT NULL")
    int permanentlyDeleteById(@Param("priceId") Integer priceId);

    /**
     * Permanently removes all the Prices of the given productId from the 'prices' database table, whether or not they
     * are soft deleted. A query is needed because deleting through the entity is a soft delete.
     * @param productId productId of the Prices to remove
     * @return The number of removed Prices
     */
    @Modifying
    @Query(value = "DELETE FROM Price p WHERE p.product.productId = :productId")
    int permanentlyDeleteByProductId(@Param("productId") Integer productId);

    /**
     * Gets a distinct list of recently added non-deleted Price base amounts for the given product ID.
     * @param pageable Pagination settings
     * @param productId Product to fetch base amounts for
     * @return A distinct list of recently added Price base amounts for the given product ID (default 20)
     */
    @Query(value = "SELECT p.amount FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.deletedAt IS NULL AND p.product.productId = :productId GROUP BY p.amount)")
    Page<Double> findDistinctBaseAmounts(Pageable pageable, Integer productId);

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
     * Gets a distinct list of recently added non-deleted Price discount percentages.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price discount percentages (default 20)
     */
    @Query(value = "SELECT p.discountPercentage FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.deletedAt IS NULL GROUP BY p.discountPercentage) ORDER BY p.createdAt DESC")
    Page<Double> findDistinctDiscountPercentages(Pageable pageable);

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
     * Gets a distinct list of the start and end dates of recently added non-deleted Prices that have an end date. Both
     * dates come from the same Price, so each period is one that was actually used.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price periods, newest first (default 20)
     */
    @Query(value = """
        SELECT new com.christian4747.pricetracker.models.PricePeriod(p.priceStarted, p.priceEnded) FROM Price p
        WHERE p.priceId IN (
            SELECT MAX(p.priceId) FROM Price p
            WHERE p.priceEnded IS NOT NULL AND p.deletedAt IS NULL
            GROUP BY p.priceStarted, p.priceEnded)
        ORDER BY p.createdAt DESC
    """)
    Page<PricePeriod> findDistinctPricePeriods(Pageable pageable);

    /**
     * Gets a distinct list of recently added non-deleted Price return percentages.
     * @param pageable Pagination settings
     * @return A distinct list of recently added Price return percentages (default 20)
     */
    @Query(value = "SELECT p.returnPercentage FROM Price p WHERE p.priceId IN (SELECT MAX(p.priceId) FROM Price p WHERE p.deletedAt IS NULL GROUP BY p.returnPercentage) ORDER BY p.createdAt DESC")
    Page<Double> findDistinctReturnPercentages(Pageable pageable);

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
     * Gets the values needed to average the started Price(s) for the given productId that are not deleted, from oldest
     * to newest, with ties in start order kept in the order they were added. Selects only those values because loading
     * a Price also loads its Product.
     * @param productId productId of the Price(s) to get
     * @return The started Price(s) for the given productId
     */
    @Query(value = """
        SELECT new com.christian4747.pricetracker.models.StartedPrice(
            p.totalAmount, p.currency, p.priceStarted, p.amount, p.discountAmount, p.description)
        FROM Price p
        WHERE p.priceStarted <= CURRENT_TIMESTAMP
            AND p.product.productId = :productId
            AND p.deletedAt IS NULL
        ORDER BY p.priceStarted, p.priceId
    """)
    List<StartedPrice> findStartedPrices(@Param("productId") Integer productId);

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

    /**
     * Gets the non-deleted Prices of non-deleted Products that fall within the given dates, newest start first. A Price matches when both its
     * start and end are within the dates, so Prices with no end date never match.
     * @param pageable Pagination settings
     * @param periodStarted Start of the dates the Prices must fall within
     * @param periodEnded End of the dates the Prices must fall within
     * @param store Store the Prices' Products must be at, or null for every store
     * @return The matching Prices
     */
    @Query(value = """
        SELECT p FROM Price p
        WHERE p.deletedAt IS NULL
        AND p.product.deletedAt IS NULL
        AND p.priceStarted >= :periodStarted
        AND p.priceEnded <= :periodEnded
        AND (:store IS NULL OR p.product.store = :store)
        ORDER BY p.priceStarted DESC, p.priceId DESC
        """)
    Page<Price> findAllWithinPeriod(Pageable pageable, @Param("periodStarted") Timestamp periodStarted,
            @Param("periodEnded") Timestamp periodEnded, @Param("store") String store);
}
