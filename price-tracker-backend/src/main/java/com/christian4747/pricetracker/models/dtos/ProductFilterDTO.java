package com.christian4747.pricetracker.models.dtos;

public record ProductFilterDTO(
        String brand,
        String name,
        String store,
        Boolean active,
        String startUpdatedAt,
        String endUpdatedAt,
        String startCreatedAt,
        String endCreatedAt,
        String deleted,
        String startDeletedAt,
        String endDeletedAt
) {
}
