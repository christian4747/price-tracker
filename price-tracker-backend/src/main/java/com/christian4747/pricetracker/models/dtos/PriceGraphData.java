package com.christian4747.pricetracker.models.dtos;

import com.christian4747.pricetracker.models.Price;

import java.sql.Timestamp;

public record PriceGraphData(
        Integer priceId,
        Timestamp priceStarted,
        Double totalAmount,
        String description,
        String currency,
        Boolean today
) {
    public static PriceGraphData from(Price price) {
        return new PriceGraphData(
                price.getPriceId(),
                price.getPriceStarted(),
                price.getTotalAmount(),
                price.getDescription(),
                price.getCurrency(),
                price.isToday()
        );
    }
}
