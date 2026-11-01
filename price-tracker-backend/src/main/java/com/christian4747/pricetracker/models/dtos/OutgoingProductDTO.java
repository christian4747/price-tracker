package com.christian4747.pricetracker.models.dtos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;

import java.sql.Timestamp;

public record OutgoingProductDTO(
        Product product,
        Price priceToday,
        Price nextPrice,
        Timestamp lastUpdated,
        String priceCategory, /* Labels such as all-time, two-year, and one-year. */
        Double averagePrice, /* Null if no price has started or the prices use different currencies. */
        Double weightedAveragePrice, /* Weighted by how long each price lasted. Null in the same cases. */
        boolean belowAverage /* Whether today's price is below the average price. */
) {
}
