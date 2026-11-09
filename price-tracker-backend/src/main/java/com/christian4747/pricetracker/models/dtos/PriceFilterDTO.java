package com.christian4747.pricetracker.models.dtos;

import java.time.Instant;

/**
 * Filters prices by their total amount, total percentage, and when they started: startDate and endDate both limit a
 * price's priceStarted. The dates are ISO dates in UTC, such as "2025-11-08T03:00:00.000Z".
 * <p>
 * Every bound is inclusive except endDate. A user who types a maximum price of 20 expects a price of 20 to match (see
 * NumberBounds). endDate is exclusive because the frontend sends the start of the next day for a chosen end day, so
 * a price starting at that next midnight is left out.
 */
public record PriceFilterDTO(
        Double minPrice,
        Double maxPrice,
        Double minDiscountPercent,
        Double maxDiscountPercent,
        Instant startDate,
        Instant endDate
) {
}
