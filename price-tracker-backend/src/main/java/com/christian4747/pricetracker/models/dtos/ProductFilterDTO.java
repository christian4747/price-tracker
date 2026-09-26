package com.christian4747.pricetracker.models.dtos;

public record ProductFilterDTO(
        String brand,
        String name,
        String store,
        String active,
        String startUpdatedAt,
        String endUpdatedAt,
        String startCreatedAt,
        String endCreatedAt,
        Boolean deleted,
        String startDeletedAt,
        String endDeletedAt
) {
}
