package com.christian4747.pricetracker.models;

import java.sql.Timestamp;

public record StartedPrice(double totalAmount, String currency, Timestamp priceStarted) {
}
