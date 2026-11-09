package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.seed.SeedData.SeedPeriod;
import com.christian4747.pricetracker.seed.SeedData.SeedPrice;
import com.christian4747.pricetracker.seed.SeedData.SeedProduct;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * The local dummy data. Dates are counted back from the moment of seeding, so a Price that is live today stays live
 * however long ago the data was first made.
 */
public final class DevSeedData {

    private DevSeedData() {
    }

    /**
     * Builds the dummy data.
     * @param now The moment of seeding
     * @return The dummy data, with dates counted back from now
     */
    public static SeedData build(Instant now) {
        Instant added = daysAgo(now, 400);
        SeedProduct mouse = new SeedProduct("Wireless mouse", "Corner Electronics", "Acme",
                "https://corner-electronics.example/wireless-mouse", true, added, daysAgo(now, 30), null, List.of(
                new SeedPrice(29.99, "USD", "", 0, 0, added, null, false, added, null),
                new SeedPrice(29.99, "USD", "Spring sale", 0.2, 0, daysAgo(now, 200), daysAgo(now, 193), true,
                        daysAgo(now, 200), null)
        ));
        SeedPeriod springSale = new SeedPeriod("Corner Electronics spring sale", PeriodType.SALE, "Corner Electronics",
                daysAgo(now, 200), daysAgo(now, 193), daysAgo(now, 201), null);
        return new SeedData(List.of(mouse), List.of(springSale));
    }

    private static Instant daysAgo(Instant now, int days) {
        return now.minus(Duration.ofDays(days));
    }
}
