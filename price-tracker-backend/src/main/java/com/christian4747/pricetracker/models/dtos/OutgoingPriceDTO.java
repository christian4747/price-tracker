package com.christian4747.pricetracker.models.dtos;

import com.christian4747.pricetracker.models.Price;

import java.util.List;

public record OutgoingPriceDTO(List<Price> prices, List<PriceGraphData> priceGraphData) { }
