package com.christian4747.pricetracker.models.dtos;

import java.util.List;

public record ProductNameGroupDTOAndCount(Integer count, List<ProductNameGroupDTO> productNameGroupDTOs) {}
