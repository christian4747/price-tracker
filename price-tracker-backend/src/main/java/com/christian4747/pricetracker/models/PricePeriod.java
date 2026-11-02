package com.christian4747.pricetracker.models;

import java.sql.Timestamp;

public record PricePeriod(Timestamp priceStarted, Timestamp priceEnded) {
}
