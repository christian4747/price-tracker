package com.christian4747.pricetracker.models.dtos;

import java.util.List;

public record ProductNameGroupDTO(String name, List<OutgoingProductDTO> products) {}
