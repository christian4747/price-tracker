package com.christian4747.pricetracker.models;

import java.sql.Timestamp;

/**
 * The values of a started Price that the averages need. The base amount, discounted amount, currency, and description
 * tell which back-to-back Prices belong to the same sale.
 */
public record StartedPrice(double totalAmount, String currency, Timestamp priceStarted, double amount,
                           double discountAmount, String description) {
}
