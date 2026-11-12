package com.christian4747.pricetracker.seed;

/**
 * How many records a seed added.
 * @param products Number of Products added
 * @param prices Number of Prices added, counting both Prices of a range
 * @param periods Number of Periods added
 */
public record SeedResult(int products, int prices, int periods) {
}
