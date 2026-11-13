package com.christian4747.pricetracker.models;

/**
 * The cheapest amounts paid for a product's prices that started in the last year, the last two years, and of all time.
 * A window's low is null when no price started in it.
 */
public record PriceLows(Double oneYearLow, Double twoYearLow, Double allTimeLow) {
}
