package com.christian4747.pricetracker.models.dtos;

public record PriceFilterDTO(
        Double minPrice,
        Double maxPrice,
        Double minDiscountPercent,
        Double maxDiscountPercent,
        String startDate,
        String endDate
) {
}
