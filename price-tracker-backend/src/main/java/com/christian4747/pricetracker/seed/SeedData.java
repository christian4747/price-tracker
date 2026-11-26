package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.models.PeriodType;

import java.time.Instant;
import java.util.List;

/**
 * The dummy records the seeder adds. Times are given in full, since the backend would otherwise stamp every record with
 * the moment it was saved.
 * @param products The Products to add, each with its Prices
 * @param periods The Periods to add
 */
public record SeedData(List<SeedProduct> products, List<SeedPeriod> periods) {

    /**
     * A Product to add.
     * @param name Name of the Product
     * @param store Store of the Product
     * @param brand Brand of the Product, or null for none
     * @param link Link to the Product, or an empty string for none
     * @param active Whether the Product is active
     * @param createdAt When the Product was added
     * @param updatedAt When the Product was last edited
     * @param deletedAt When the Product was deleted, or null if it isn't deleted. Its Prices that aren't already deleted
     *                  are deleted at the same time, as when a Product is deleted in the app.
     * @param prices The Product's Prices
     */
    public record SeedProduct(
            String name,
            String store,
            String brand,
            String link,
            boolean active,
            Instant createdAt,
            Instant updatedAt,
            Instant deletedAt,
            List<SeedPrice> prices
    ) {
    }

    /**
     * A Price to add. The discounted and return amounts are worked out from the percentages, as the add price form does.
     * @param amount The base amount
     * @param currency Currency of the Price
     * @param description Description of the Price
     * @param discountPercentage The discount, from 0 to 1
     * @param returnPercentage The return (cash or points back), from 0 to 1, of the lower of the discounted and base
     *                         amounts
     * @param priceStarted When the Price started
     * @param priceEnded When the Price ended, or null for no end date
     * @param range Whether to add the Price as a range: the Price, then the full amount starting a minute after it ends
     * @param createdAt When the Price was added, and also when it was last edited
     * @param deletedAt When the Price was deleted on its own, or null if it isn't
     */
    public record SeedPrice(
            double amount,
            String currency,
            String description,
            double discountPercentage,
            double returnPercentage,
            Instant priceStarted,
            Instant priceEnded,
            boolean range,
            Instant createdAt,
            Instant deletedAt
    ) {
    }

    /**
     * A Period to add.
     * @param name Name of the Period
     * @param type Whether it is a sale or return Period
     * @param store Store of the Period, or null for all stores
     * @param periodStarted When the Period starts
     * @param periodEnded When the Period ends
     * @param createdAt When the Period was added, and also when it was last edited
     * @param deletedAt When the Period was deleted, or null if it isn't
     */
    public record SeedPeriod(
            String name,
            PeriodType type,
            String store,
            Instant periodStarted,
            Instant periodEnded,
            Instant createdAt,
            Instant deletedAt
    ) {
    }
}
