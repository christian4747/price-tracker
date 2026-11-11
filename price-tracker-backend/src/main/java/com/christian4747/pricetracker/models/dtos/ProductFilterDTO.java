package com.christian4747.pricetracker.models.dtos;

import java.time.Instant;

/**
 * Filters products by their brand, name, or store (any of them matching), whether they're active, and when they were
 * updated, created, or deleted. The dates are ISO dates in UTC, such as "2025-11-08T03:00:00.000Z", like
 * PriceFilterDTO's. An empty date means no filter, and a date in any other format is rejected with a 400.
 * <p>
 * Each start date is inclusive and each end date exclusive. The deletedAt dates only apply when deleted is true, since
 * deleted products are left out otherwise.
 */
public record ProductFilterDTO(
        String brand,
        String name,
        String store,
        String active,
        Instant startUpdatedAt,
        Instant endUpdatedAt,
        Instant startCreatedAt,
        Instant endCreatedAt,
        Boolean deleted,
        Instant startDeletedAt,
        Instant endDeletedAt
) {
}
