package com.christian4747.pricetracker.models;

/**
 * A Price that falls within a Period, with its Product. Price leaves its Product out of JSON, so the pair carries it.
 */
public record MatchingPeriodPrice(Price price, Product product) {
}
