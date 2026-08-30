package com.christian4747.pricetracker.models.dtos;

import java.sql.Timestamp;
import java.util.List;

public record RecentPriceData(List<String> currencies, List<String> descriptions, List<Timestamp> pricesStarted, List<Timestamp> pricesEnded) {
}
