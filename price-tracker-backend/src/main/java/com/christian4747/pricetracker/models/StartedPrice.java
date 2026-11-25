package com.christian4747.pricetracker.models;

import java.sql.Timestamp;

/**
 * The values of a started Price that the averages need. The currency tells whether the Prices can be averaged at all,
 * and the base amount, discounted amount, and description tell which back-to-back Prices belong to the same sale.
 */
public record StartedPrice(double totalAmount, String currency, Timestamp priceStarted, double amount,
                           double discountAmount, String description) {
}
