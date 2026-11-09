package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.seed.SeedData.SeedPeriod;
import com.christian4747.pricetracker.seed.SeedData.SeedPrice;
import com.christian4747.pricetracker.seed.SeedData.SeedProduct;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Random;

/**
 * The local dummy data: about fifty Products at five made-up stores, with about three years of Prices, and sale and
 * return Periods. Days are counted from the day of seeding (negative days are in the past), so a Price that is live
 * today stays live however long after the data was first made it is rebuilt. Price histories come from a random
 * generator with a fixed seed for each Product, so the same day always gives the same data.
 * <p>
 * A few Products are set up by hand for specific cases: the lowest discount of all time, of two years, and of one year
 * today ("E-reader", "Air fryer", and "Robot vacuum"), a free price ("Loyalty tote bag"), Prices without a currency
 * ("Green tea 100 bags"), a discontinued Product whose last Price has an end date ("Down vest"), a deleted Product with
 * a Price deleted before it ("Bluetooth speaker"), and Products without Prices.
 */
public final class DevSeedData {

    static final String CORNER = "Corner Electronics";
    static final String HARBOR = "Harbor Mart";
    static final String NORTHWIND = "Northwind Market";
    static final String PINE = "Pine Street Outfitters";
    static final String MAPLE = "Maple Home Goods";

    private DevSeedData() {
    }

    /**
     * Builds the dummy data, with days in the server's time zone.
     * @param now The moment of seeding
     * @return The dummy data, with dates counted from now
     */
    public static SeedData build(Instant now) {
        return build(now, ZoneId.systemDefault());
    }

    /**
     * Builds the dummy data.
     * @param now The moment of seeding
     * @param zone Time zone whose midnights start and end the days
     * @return The dummy data, with dates counted from now
     */
    static SeedData build(Instant now, ZoneId zone) {
        return new Builder(now, zone).build();
    }

    private static final class Builder {

        private final Instant now;
        private final ZoneId zone;
        private final LocalDate today;
        private final List<SeedPeriod> periods = new ArrayList<>();
        private final List<ProductSpec> products = new ArrayList<>();

        private Builder(Instant now, ZoneId zone) {
            this.now = now;
            this.zone = zone;
            this.today = now.atZone(zone).toLocalDate();
        }

        private SeedData build() {
            // Sale periods
            SeedPeriod flashSale = period("Storewide flash sale", PeriodType.SALE, null, -3, 4, null);
            SeedPeriod membersWeek = period("Members week", PeriodType.SALE, CORNER, 10, 16, null);
            SeedPeriod techWeek = period("Tech week", PeriodType.SALE, CORNER, -500, -491, null);
            SeedPeriod anniversary = period("Anniversary sale", PeriodType.SALE, NORTHWIND, -420, -411, null);
            SeedPeriod yearEnd = period("Year-end sale", PeriodType.SALE, null, -680, -671, null);
            SeedPeriod clearance = period("Clearance event", PeriodType.SALE, PINE, -790, -781, null);
            SeedPeriod grandOpening = period("Grand opening sale", PeriodType.SALE, MAPLE, -900, -894, -600);
            // Return periods (cash or points back)
            SeedPeriod cashbackWeekend = period("Cashback weekend", PeriodType.RETURN, null, -60, -58, null);
            SeedPeriod pointsBonus = period("Points bonus week", PeriodType.RETURN, HARBOR, -150, -144, null);
            SeedPeriod holidayCashback = period("Holiday cashback", PeriodType.RETURN, null, -330, -317, null);
            SeedPeriod pointsBoost = period("Double points days", PeriodType.RETURN, HARBOR, 30, 33, null);

            // Corner Electronics
            product("Wireless mouse", CORNER).brand("Kestrel").history(29.99, -1090);
            product("Mechanical keyboard", CORNER).brand("Kestrel").history(89, -1020)
                    .sale(membersWeek, 0.2).typo(-400, 899);
            product("Noise-cancelling headphones", CORNER).brand("Solace").history(249, -1060)
                    .sale(techWeek, 0.2).cashback(cashbackWeekend, 0.1);
            product("USB-C cable 2 m", CORNER).brand("Orbit").history(14.99, -980).sale(techWeek, 0.25);
            product("27-inch monitor", CORNER).brand("Meridian").history(329, -870).sale(membersWeek, 0.15);
            product("Portable SSD 1 TB", CORNER).brand("Orbit").history(119, -640).sale(membersWeek, 0.25);
            product("Smart plug 4-pack", CORNER).brand("Brightline").history(39.99, -720)
                    .cashback(holidayCashback, 0.1);
            product("Webcam 1080p", CORNER).brand("Meridian").history(69, -950).stoppedAt(-210).inactive();
            product("Desk lamp", CORNER).brand("Brightline").history(34.99, -560);
            product("Phone charger 30 W", CORNER).brand("Orbit").history(24.99, -1000).sale(techWeek, 0.3);
            product("Bluetooth speaker", CORNER).brand("Solace").history(59, -900).typo(-300, 5.9).deleted(-40);
            // Every sale is at most 25% off before today's 30%, so today is the lowest of all time
            product("E-reader", CORNER).brand("Halden").history(139, -1095).noRandomSales()
                    .sale(-860, -853, 0.15, "Limited-time deal").sale(techWeek, 0.25).sale(-200, -196, 0.1, "Weekend deal")
                    .sale(flashSale, 0.3);

            // Harbor Mart
            product("Wireless mouse", HARBOR).history(27.49, -800).sale(flashSale, 0.1);
            product("Noise-cancelling headphones", HARBOR).brand("Solace").history(259, -700);
            product("USB-C cable 2 m", HARBOR).history(12.99, -450);
            product("Coffee beans 1 kg", HARBOR).brand("Corvid Roasters").history(21.99, -1080)
                    .price(12, 24.99, "Announced price increase").typo(-90, 21.99);
            product("Olive oil 1 L", HARBOR).brand("Verde").history(13.49, -900).cashback(pointsBonus, 0.05);
            product("Running shoes", HARBOR).brand("Tamarack").history(119, -380);
            product("Backpack", HARBOR).history(49.99, -620);
            product("Bath towel set", HARBOR).history(39.99, -540).cashback(pointsBonus, 0.1);
            product("Rain jacket", HARBOR).history(79, -300).cashback(pointsBonus, 0.05);
            product("Laundry detergent 3 L", HARBOR).brand("Brightline").history(16.99, -1050)
                    .cashback(pointsBoost, 0.1);
            product("Paper towels 12-pack", HARBOR).history(18.49, -990).cashback(pointsBoost, 0.05);
            // 25% off a year and a half ago, then today's 15% is the lowest of one year but not of two
            product("Robot vacuum", HARBOR).brand("Tamarack").history(299, -760).noRandomSales()
                    .sale(yearEnd, 0.25).sale(flashSale, 0.15);
            // 35% off over two years ago, at most 15% since, then today's 20% is the lowest of two years but not of all time
            product("Air fryer", HARBOR).brand("Juniper").history(99, -1000).noRandomSales()
                    .sale(-930, -924, 0.35, "Launch discount").sale(yearEnd, 0.15).sale(flashSale, 0.2);

            // Northwind Market
            product("Coffee beans 1 kg", NORTHWIND).brand("Corvid Roasters").history(19.99, -1040)
                    .cashback(cashbackWeekend, 0.05);
            product("Olive oil 1 L", NORTHWIND).brand("Verde").history(12.99, -800).sale(anniversary, 0.2);
            product("USB-C cable 2 m", NORTHWIND).history(9.99, -260);
            product("Dark chocolate 6-pack", NORTHWIND).history(17.49, -700).sale(flashSale, 0.15);
            product("Green tea 100 bags", NORTHWIND).history(8.99, -1070).blankCurrencyBefore(-365)
                    .sale(anniversary, 0.1);
            product("Oat milk 6-pack", NORTHWIND).history(15.99, -600).sale(anniversary, 0.15);
            product("Rice 5 kg", NORTHWIND).history(18.99, -1000).cashback(holidayCashback, 0.05)
                    .price(30, 21.49, "");
            product("Loyalty tote bag", NORTHWIND).noLink().history(4.99, -200).noRandomSales()
                    .price(-30, 0, "Free with any purchase over $50");
            product("Sparkling water 24-pack", NORTHWIND).history(11.99, -880).stoppedAt(-120).inactive();
            product("Peanut butter", NORTHWIND).history(5.49, -700).sale(anniversary, 0.15).deleted(-200);

            // Pine Street Outfitters
            product("Running shoes", PINE).brand("Tamarack").history(124, -1030).sale(flashSale, 0.25).typo(-500, 12.4);
            product("Backpack", PINE).brand("Tamarack").history(54, -950).cashback(cashbackWeekend, 0.08);
            product("Rain jacket", PINE).brand("Fjell").history(89, -1010).sale(clearance, 0.25);
            product("Merino socks 3-pack", PINE).brand("Fjell").history(29.99, -880).sale(clearance, 0.2);
            product("Hiking boots", PINE).brand("Fjell").history(169, -990).sale(clearance, 0.3).sale(yearEnd, 0.2);
            product("Insulated water bottle", PINE).history(32, -330);
            product("Down vest", PINE).brand("Fjell").history(129, -1000).sale(clearance, 0.4).stoppedAt(-150)
                    .inactive();
            product("Camping lantern", PINE).brand("Fjell").addedOn(-2);

            // Maple Home Goods
            product("Desk lamp", MAPLE).history(29.99, -1000).sale(yearEnd, 0.2);
            product("Bath towel set", MAPLE).brand("Juniper").history(44.99, -1050).sale(grandOpening, 0.2);
            product("Cast iron skillet", MAPLE).brand("Juniper").history(39, -820).cashback(cashbackWeekend, 0.1);
            product("Chef's knife 8-inch", MAPLE).brand("Halden").history(79, -700).cashback(holidayCashback, 0.1);
            product("Bed sheet set queen", MAPLE).history(69, -1000).sale(grandOpening, 0.25);
            product("Throw blanket", MAPLE).history(49.99, -500).sale(flashSale, 0.2);
            product("Ceramic dinnerware set 16-piece", MAPLE).brand("Juniper").history(119, -1000)
                    .sale(grandOpening, 0.3).deleted(-5);
            product("Scented candle", MAPLE).addedOn(-6);
            product("Extra large adjustable standing desk converter with keyboard tray and monitor shelf", MAPLE)
                    .brand("Meridian Workspace Solutions International").history(219, -90).noRandomSales();

            return new SeedData(products.stream().map(ProductSpec::toSeedProduct).toList(), List.copyOf(periods));
        }

        private ProductSpec product(String name, String store) {
            ProductSpec spec = new ProductSpec(name, store);
            products.add(spec);
            return spec;
        }

        /**
         * Adds a Period from the start of one day to the end of another.
         * @param deletedDay Day the Period was deleted, or null if it isn't deleted
         */
        private SeedPeriod period(String name, PeriodType type, String store, int fromDay, int toDay, Integer deletedDay) {
            Instant start = startOf(fromDay);
            // Periods are usually made a couple of weeks ahead, but never in the future
            Instant createdAt = earliest(start.minus(Duration.ofDays(14)), now.minus(Duration.ofDays(2)));
            SeedPeriod period = new SeedPeriod(name, type, store, start, endOf(toDay), createdAt,
                    deletedDay == null ? null : at(deletedDay, 10));
            periods.add(period);
            return period;
        }

        private Instant startOf(int day) {
            return today.plusDays(day).atStartOfDay(zone).toInstant();
        }

        /** The last minute of the day, as the add price form sets an end date. */
        private Instant endOf(int day) {
            return today.plusDays(day).atTime(23, 59).atZone(zone).toInstant();
        }

        private Instant at(int day, int hour) {
            return today.plusDays(day).atTime(hour, 0).atZone(zone).toInstant();
        }

        private static Instant earliest(Instant a, Instant b) {
            return a.isBefore(b) ? a : b;
        }

        private record Step(Instant start, double amount, String description) {
        }

        private record Sale(Instant start, Instant end, double discount, double returnPercentage, String description) {
        }

        private final class ProductSpec {

            private final String name;
            private final String store;
            private final Random random;
            private String brand;
            private boolean hasLink = true;
            private boolean active = true;
            private boolean randomSales = true;
            private double base;
            private Integer historyFromDay;
            private int lastDay = -1;
            private boolean stopped;
            private Integer deletedDay;
            private Integer addedDay;
            private Integer blankCurrencyBeforeDay;
            private final List<Step> extraSteps = new ArrayList<>();
            private final List<Sale> sales = new ArrayList<>();
            private final List<Step> typos = new ArrayList<>();

            private ProductSpec(String name, String store) {
                this.name = name;
                this.store = store;
                this.random = new Random(Objects.hash(name, store));
            }

            private ProductSpec brand(String brand) {
                this.brand = brand;
                return this;
            }

            private ProductSpec noLink() {
                this.hasLink = false;
                return this;
            }

            private ProductSpec inactive() {
                this.active = false;
                return this;
            }

            private ProductSpec noRandomSales() {
                this.randomSales = false;
                return this;
            }

            /** Regular Prices from the given day until yesterday, changing every month or few. */
            private ProductSpec history(double base, int fromDay) {
                this.base = base;
                this.historyFromDay = fromDay;
                return this;
            }

            /** The last Price ends on the given day, and none follow it. */
            private ProductSpec stoppedAt(int day) {
                this.lastDay = day;
                this.stopped = true;
                return this;
            }

            /** The Product and its Prices are deleted on the given day, and no Prices start after it. */
            private ProductSpec deleted(int day) {
                this.deletedDay = day;
                this.lastDay = Math.min(lastDay, day - 1);
                return this;
            }

            /** A Product without Prices, added on the given day. */
            private ProductSpec addedOn(int day) {
                this.addedDay = day;
                return this;
            }

            private ProductSpec blankCurrencyBefore(int day) {
                this.blankCurrencyBeforeDay = day;
                return this;
            }

            /** A regular Price on the given day, which may be in the future. */
            private ProductSpec price(int day, double amount, String description) {
                extraSteps.add(new Step(at(day, 9), amount, description));
                return this;
            }

            /** A mistyped Price, deleted shortly after it was added. */
            private ProductSpec typo(int day, double amount) {
                typos.add(new Step(at(day, 20), amount, ""));
                return this;
            }

            /** A discount for the whole of a sale Period, as the add price form's Sale Period option sets it. */
            private ProductSpec sale(SeedPeriod period, double discount) {
                checkStore(period);
                sales.add(new Sale(period.periodStarted(), period.periodEnded(), discount, 0, period.name()));
                return this;
            }

            /** A discount from the start of one day to the end of another, outside any Period. */
            private ProductSpec sale(int fromDay, int toDay, double discount, String description) {
                sales.add(new Sale(startOf(fromDay), endOf(toDay), discount, 0, description));
                return this;
            }

            /** A return (cash or points back) for the whole of a return Period. */
            private ProductSpec cashback(SeedPeriod period, double returnPercentage) {
                checkStore(period);
                sales.add(new Sale(period.periodStarted(), period.periodEnded(), 0, returnPercentage, period.name()));
                return this;
            }

            private void checkStore(SeedPeriod period) {
                if (period.store() != null && !period.store().equals(store)) {
                    throw new IllegalStateException(name + " at " + store + " can't be in " + period.name());
                }
            }

            private SeedProduct toSeedProduct() {
                List<Step> steps = regularSteps();
                List<Sale> allSales = new ArrayList<>(sales);
                if (randomSales) allSales.addAll(randomSales(steps));
                allSales.sort(Comparator.comparing(Sale::start));
                // A regular Price never starts during a sale, or in the two days after it
                steps.removeIf(step -> allSales.stream().anyMatch(sale ->
                        !step.start().isBefore(sale.start()) && step.start().isBefore(sale.end().plus(Duration.ofDays(2)))));

                Instant createdAt = productCreatedAt(steps, allSales);
                Instant deletedAt = deletedDay == null ? null : at(deletedDay, 21);
                List<SeedPrice> prices = new ArrayList<>();
                for (int i = 0; i < steps.size(); i++) {
                    Step step = steps.get(i);
                    boolean last = i == steps.size() - 1;
                    Instant ended = stopped && last ? endOf(lastDay) : null;
                    prices.add(new SeedPrice(step.amount(), currency(step.start()), step.description(), 0, 0,
                            step.start(), ended, false, priceCreatedAt(step.start().plus(Duration.ofHours(2))), null));
                }
                for (Sale sale : allSales) {
                    double amount = amountAt(steps, sale.start());
                    prices.add(new SeedPrice(amount, currency(sale.start()), sale.description(), sale.discount(),
                            sale.returnPercentage(), sale.start(), sale.end(), true,
                            priceCreatedAt(sale.start().minus(Duration.ofDays(1))), null));
                }
                for (Step typo : typos) {
                    Instant typoCreatedAt = priceCreatedAt(typo.start());
                    prices.add(new SeedPrice(typo.amount(), currency(typo.start()), "", 0, 0, typo.start(), null, false,
                            typoCreatedAt, typoCreatedAt.plus(Duration.ofMinutes(25))));
                }
                prices.sort(Comparator.comparing(SeedPrice::priceStarted));

                return new SeedProduct(name, store, brand, link(), active, createdAt,
                        updatedAt(createdAt, deletedAt), deletedAt, prices);
            }

            private List<Step> regularSteps() {
                List<Step> steps = new ArrayList<>();
                if (historyFromDay != null) {
                    double amount = base;
                    for (int day = historyFromDay; day <= lastDay; day += 35 + random.nextInt(85)) {
                        steps.add(new Step(at(day, 10 + random.nextInt(10)), roundPrice(amount), ""));
                        // Prices drift up a little over time, with ups and downs
                        amount *= 1 + 0.008 + random.nextGaussian() * 0.035;
                    }
                }
                steps.addAll(extraSteps);
                steps.sort(Comparator.comparing(Step::start));
                return steps;
            }

            /**
             * About one unnamed sale a year, two months or more from the Product's named sales, and outside every Period
             * at its store, so a Period never lists an unnamed sale.
             */
            private List<Sale> randomSales(List<Step> steps) {
                List<Sale> randomSales = new ArrayList<>();
                if (steps.isEmpty()) return randomSales;
                double[] discounts = {0.1, 0.15, 0.2, 0.25};
                String[] descriptions = {"Weekend deal", "Seasonal sale", "Clearance", ""};
                for (int day = historyFromDay + 60 + random.nextInt(120); day < lastDay - 14; day += 220 + random.nextInt(200)) {
                    int length = 2 + random.nextInt(8);
                    Instant start = startOf(day);
                    Instant end = endOf(day + length);
                    boolean nearNamedSale = sales.stream().anyMatch(sale ->
                            sale.start().isBefore(end.plus(Duration.ofDays(60))) && sale.end().isAfter(start.minus(Duration.ofDays(60))));
                    boolean inPeriod = periods.stream()
                            .filter(period -> period.store() == null || period.store().equals(store))
                            .anyMatch(period -> period.periodStarted().isBefore(end) && period.periodEnded().isAfter(start));
                    if (nearNamedSale || inPeriod) continue;
                    randomSales.add(new Sale(start, end, discounts[random.nextInt(discounts.length)], 0,
                            descriptions[random.nextInt(descriptions.length)]));
                }
                return randomSales;
            }

            /** The amount of the regular Price in effect at the given moment, which a sale is a discount on. */
            private double amountAt(List<Step> steps, Instant moment) {
                return steps.stream()
                        .filter(step -> !step.start().isAfter(moment))
                        .reduce((first, second) -> second)
                        .orElseThrow(() -> new IllegalStateException(name + " at " + store + " has a sale before its first price"))
                        .amount();
            }

            private Instant productCreatedAt(List<Step> steps, List<Sale> allSales) {
                if (addedDay != null) return at(addedDay, 18);
                Instant firstStart = steps.isEmpty() ? now : steps.getFirst().start();
                for (Sale sale : allSales) firstStart = earliest(firstStart, sale.start());
                return firstStart.minus(Duration.ofHours(2));
            }

            /** When a Price was added: the given time, but never in the future. */
            private Instant priceCreatedAt(Instant wanted) {
                return earliest(wanted, now.minus(Duration.ofMinutes(10)));
            }

            /** The last edit: some time after the Product was added, and before it was deleted or stopped. */
            private Instant updatedAt(Instant createdAt, Instant deletedAt) {
                Instant until = deletedAt != null ? deletedAt : stopped ? endOf(lastDay) : now;
                long span = Duration.between(createdAt, until).toMinutes();
                return createdAt.plus(Duration.ofMinutes((long) (span * (stopped ? 1 : 0.05 + random.nextDouble() * 0.85))));
            }

            private String currency(Instant moment) {
                return blankCurrencyBeforeDay != null && moment.isBefore(startOf(blankCurrencyBeforeDay)) ? "" : "USD";
            }

            private String link() {
                if (!hasLink || random.nextDouble() < 0.3) return "";
                return "https://" + slug(store) + ".example/" + slug(name);
            }

            private static String slug(String text) {
                return text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
            }

            /** Rounds to a price ending in 99 cents, or in 24, 49, 74, or 99 cents under $20. */
            private static double roundPrice(double amount) {
                double step = amount < 20 ? 0.25 : 1;
                return Math.round((Math.max(Math.round(amount / step) * step, step) - 0.01) * 100) / 100.0;
            }
        }
    }
}
