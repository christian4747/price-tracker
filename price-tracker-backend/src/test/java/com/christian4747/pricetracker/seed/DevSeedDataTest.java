package com.christian4747.pricetracker.seed;

import com.christian4747.pricetracker.models.PeriodType;
import com.christian4747.pricetracker.seed.SeedData.SeedPeriod;
import com.christian4747.pricetracker.seed.SeedData.SeedPrice;
import com.christian4747.pricetracker.seed.SeedData.SeedProduct;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Checks the dummy data itself, without a database: that the app would accept every record, and that it covers the
 * cases the app's screens need to be tried out with.
 */
class DevSeedDataTest {

    // A fixed moment and time zone, so the data, and so every test's result, is the same on every run and machine
    private static final Instant NOW = Instant.parse("2026-11-09T03:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Tokyo");
    // Built once and shared, since building is the slow part and no test changes it
    private static final SeedData DATA = DevSeedData.build(NOW, ZONE);
    // The list shows ten Products, or ten groups of Products sharing a name, on each page
    private static final int PAGE_SIZE = 10;

    /**
     * A Price together with its Product, for checks that need both.
     * @param product The Product
     * @param price One of its Prices
     */
    private record ProductPrice(SeedProduct product, SeedPrice price) {
    }

    /**
     * Gets the Products the list shows by default, which leaves out deleted ones.
     * @return The Products that aren't deleted
     */
    private static List<SeedProduct> shownProducts() {
        return DATA.products().stream().filter(product -> product.deletedAt() == null).toList();
    }

    /**
     * Gets every Price of every Product, deleted or not.
     * @return Each Price with its Product
     */
    private static List<ProductPrice> allPrices() {
        return DATA.products().stream()
                .flatMap(product -> product.prices().stream().map(price -> new ProductPrice(product, price)))
                .toList();
    }

    /**
     * Checks whether any Price, of any Product, matches a condition.
     * @param predicate The condition
     * @return Whether at least one Price matches it
     */
    private static boolean anyPrice(Predicate<ProductPrice> predicate) {
        return allPrices().stream().anyMatch(predicate);
    }

    /**
     * Checks whether a Price shows by default: neither it nor its Product is deleted.
     * @param productPrice The Price, with its Product
     * @return Whether the Price shows without Show deleted prices
     */
    private static boolean shownPrice(ProductPrice productPrice) {
        return productPrice.product().deletedAt() == null && productPrice.price().deletedAt() == null;
    }

    /**
     * Gets the moment a number of years before NOW, as the chart's time ranges count back.
     * @param years How many years back
     * @return The moment that many years ago, in the test's time zone
     */
    private static Instant yearsAgo(int years) {
        return NOW.atZone(ZONE).minusYears(years).toInstant();
    }

    /**
     * Checks whether a Price is one of a Period's matching Prices, as PriceDAO.findAllWithinPeriod finds them: it has an
     * end date, falls within the Period's dates, and is at the Period's store, or the Period is for every store. The
     * query also leaves out deleted records, which callers check with shownPrice where it matters.
     * @param period The Period
     * @param productPrice The Price, with its Product
     * @return Whether the Period lists the Price
     */
    private static boolean matches(SeedPeriod period, ProductPrice productPrice) {
        SeedPrice price = productPrice.price();
        return price.priceEnded() != null
                && !price.priceStarted().isBefore(period.periodStarted())
                && !price.priceEnded().isAfter(period.periodEnded())
                && (period.store() == null || period.store().equals(productPrice.product().store()));
    }

    /**
     * Building again at the same moment gives the same data, so nothing in it changes at random between builds. Each
     * Product's random history comes from a generator seeded with its name and store.
     */
    @Test
    void sameMomentGivesTheSameData() {
        assertThat(DevSeedData.build(NOW, ZONE)).isEqualTo(DATA);
    }

    /**
     * The app rejects a second Product with the same name and store, so a duplicate would fail the whole seed.
     */
    @Test
    void productsAreUniqueByNameAndStore() {
        assertThat(DATA.products())
                .extracting(product -> product.name() + " at " + product.store())
                .doesNotHaveDuplicates();
    }

    /**
     * The app rejects a Period whose name differs from another's only in case, so a duplicate would fail the seed.
     */
    @Test
    void periodNamesAreUniqueIgnoringCase() {
        assertThat(DATA.periods())
                .extracting(period -> period.name().toLowerCase(Locale.ROOT))
                .doesNotHaveDuplicates();
    }

    /**
     * Reseeding permanently removes records with the seed's names, so the seed must not share names with records made
     * by hand for testing, such as "Product 1" or "Test sale".
     */
    @Test
    void seedDoesntOwnTheHandMadeTestRecords() {
        assertThat(DATA.products()).extracting(SeedProduct::name).noneMatch(name -> name.matches("Product \\d+|\\d+"));
        assertThat(DATA.periods()).extracting(SeedPeriod::name).noneMatch(name -> name.matches("(?i).*test.*|Period \\d+"));
    }

    /**
     * Nothing can have been added after the moment of seeding, which would show as added in the future.
     */
    @Test
    void addedTimesAreNotInTheFuture() {
        assertThat(DATA.products()).allMatch(product -> !product.createdAt().isAfter(NOW));
        assertThat(allPrices()).allMatch(productPrice -> !productPrice.price().createdAt().isAfter(NOW));
        assertThat(DATA.periods()).allMatch(period -> !period.createdAt().isAfter(NOW));
    }

    /**
     * A Product's last edit can't come before it was added, or after the moment of seeding.
     */
    @Test
    void productsAreUpdatedAfterTheyAreAddedAndBeforeNow() {
        assertThat(DATA.products()).allMatch(product ->
                !product.updatedAt().isBefore(product.createdAt()) && !product.updatedAt().isAfter(NOW));
    }

    /**
     * A record is deleted after it was added (a Product after its last edit too), and not after the moment of seeding.
     */
    @Test
    void deletedTimesAreAfterTheAddedTimesAndNotInTheFuture() {
        assertThat(DATA.products()).filteredOn(product -> product.deletedAt() != null)
                .allMatch(product -> product.deletedAt().isAfter(product.updatedAt()) && !product.deletedAt().isAfter(NOW));
        assertThat(allPrices()).filteredOn(productPrice -> productPrice.price().deletedAt() != null)
                .allMatch(productPrice -> productPrice.price().deletedAt().isAfter(productPrice.price().createdAt())
                        && !productPrice.price().deletedAt().isAfter(NOW));
        assertThat(DATA.periods()).filteredOn(period -> period.deletedAt() != null)
                .allMatch(period -> period.deletedAt().isAfter(period.createdAt()) && !period.deletedAt().isAfter(NOW));
    }

    /**
     * A Price can only be added to a Product that already exists.
     */
    @Test
    void pricesAreAddedAfterTheirProduct() {
        assertThat(allPrices()).allMatch(productPrice ->
                productPrice.price().createdAt().isAfter(productPrice.product().createdAt()));
    }

    /**
     * The app doesn't let a Price be added to a deleted Product.
     */
    @Test
    void pricesOfADeletedProductAreAddedBeforeItIsDeleted() {
        assertThat(allPrices()).filteredOn(productPrice -> productPrice.product().deletedAt() != null)
                .allMatch(productPrice -> productPrice.price().createdAt().isBefore(productPrice.product().deletedAt()));
    }

    /**
     * The app rejects a Price that ends before it starts.
     */
    @Test
    void pricesEndAfterTheyStart() {
        assertThat(allPrices()).filteredOn(productPrice -> productPrice.price().priceEnded() != null)
                .allMatch(productPrice -> productPrice.price().priceEnded().isAfter(productPrice.price().priceStarted()));
    }

    /**
     * A Price starting during a sale would cut the sale short, since a Price lasts until the next one starts.
     */
    @Test
    void noPriceStartsDuringASale() {
        for (SeedProduct product : DATA.products()) {
            // A sale is added as a range, the sale Price and the full Price after it
            List<SeedPrice> sales = product.prices().stream().filter(SeedPrice::range).toList();
            assertThat(product.prices())
                    .as(product.name() + " at " + product.store())
                    // A deleted Price doesn't count, since it no longer cuts anything short
                    .filteredOn(price -> price.deletedAt() == null)
                    .noneMatch(price -> sales.stream().anyMatch(sale -> price.priceStarted().isAfter(sale.priceStarted())
                            && !price.priceStarted().isAfter(sale.priceEnded())));
        }
    }

    /**
     * The app rejects a Period that ends before it starts.
     */
    @Test
    void periodsEndAfterTheyStart() {
        assertThat(DATA.periods()).allMatch(period -> period.periodEnded().isAfter(period.periodStarted()));
    }

    /**
     * Percentages are shares from 0 to 1. A whole 1 would mean 100% off or back, so the free Price is a $0.00 amount
     * instead.
     */
    @Test
    void percentagesAreBetweenZeroAndOne() {
        assertThat(allPrices()).allMatch(productPrice -> productPrice.price().discountPercentage() >= 0
                && productPrice.price().discountPercentage() < 1
                && productPrice.price().returnPercentage() >= 0
                && productPrice.price().returnPercentage() < 1);
    }

    /**
     * The chart's All range has about three years to show: some Prices start within a month of three years ago, and
     * none much earlier.
     */
    @Test
    void pricesGoBackAboutThreeYears() {
        assertThat(allPrices()).extracting(productPrice -> productPrice.price().priceStarted())
                .allMatch(started -> started.isAfter(yearsAgo(3).minus(Duration.ofDays(30))))
                .anyMatch(started -> started.isBefore(yearsAgo(3).plus(Duration.ofDays(30))));
    }

    /**
     * The chart's 1 year, 2 years, and All time ranges each show different Prices, so switching between them has
     * something to change.
     */
    @Test
    void somePricesStartInEachTimeRange() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().priceStarted().isAfter(yearsAgo(1)))).isTrue();
        assertThat(anyPrice(productPrice -> shownPrice(productPrice)
                && productPrice.price().priceStarted().isBefore(yearsAgo(1))
                && productPrice.price().priceStarted().isAfter(yearsAgo(2)))).isTrue();
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().priceStarted().isBefore(yearsAgo(2)))).isTrue();
    }

    /**
     * A Product tracked for less than a year looks the same in every time range, which is worth trying too.
     */
    @Test
    void someProductsHaveOnlyRecentPrices() {
        assertThat(shownProducts()).anyMatch(product -> !product.prices().isEmpty()
                && product.prices().stream().allMatch(price -> price.priceStarted().isAfter(yearsAgo(1))));
    }

    /**
     * A regular Price that hasn't started yet, such as an announced price increase, so the list and chart can be tried
     * with one.
     */
    @Test
    void somePricesStartInTheFuture() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && !productPrice.price().range()
                && productPrice.price().priceStarted().isAfter(NOW))).isTrue();
    }

    /**
     * A sale running today, so the product list shows today's discounts, banners, and timers.
     */
    @Test
    void someSalesAreLiveToday() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().range()
                && productPrice.price().discountPercentage() > 0
                && productPrice.price().priceStarted().isBefore(NOW)
                && productPrice.price().priceEnded().isAfter(NOW))).isTrue();
    }

    /**
     * Prices with cash or points back, so the details line and totals can be tried with returns.
     */
    @Test
    void somePricesHaveReturns() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().returnPercentage() > 0)).isTrue();
    }

    /**
     * A regular Price with an end date and nothing after it, as a discontinued Product's last Price.
     */
    @Test
    void somePricesEndWithoutAPriceAfterThem() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && !productPrice.price().range()
                && productPrice.price().priceEnded() != null)).isTrue();
    }

    /**
     * A $0.00 Price, which the app once showed as "(0)" in the delete confirmations.
     */
    @Test
    void somePricesAreFree() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().amount() == 0)).isTrue();
    }

    /**
     * Prices with a blank currency, which the app counts as USD.
     */
    @Test
    void somePricesHaveNoCurrency() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().currency().isEmpty())).isTrue();
    }

    /**
     * A Price deleted while its Product wasn't, so Show deleted prices has something to show.
     */
    @Test
    void somePricesAreDeletedOnTheirOwn() {
        assertThat(anyPrice(productPrice -> productPrice.product().deletedAt() == null
                && productPrice.price().deletedAt() != null)).isTrue();
    }

    /**
     * Restoring a deleted Product brings back only the Prices deleted with it, so one Price deleted before it shows
     * that an earlier delete stays.
     */
    @Test
    void aDeletedProductHasAPriceDeletedBeforeIt() {
        assertThat(anyPrice(productPrice -> productPrice.product().deletedAt() != null
                && productPrice.price().deletedAt() != null)).isTrue();
    }

    /**
     * At least two of each, so the inactive and deleted filters each list more than one Product.
     */
    @Test
    void someProductsAreInactiveAndSomeAreDeleted() {
        assertThat(DATA.products()).filteredOn(product -> !product.active()).hasSizeGreaterThanOrEqualTo(2);
        assertThat(DATA.products()).filteredOn(product -> product.deletedAt() != null).hasSizeGreaterThanOrEqualTo(2);
    }

    /**
     * A Product without Prices, so its empty chart and price list can be tried.
     */
    @Test
    void someProductsHaveNoPrices() {
        assertThat(shownProducts()).anyMatch(product -> product.prices().isEmpty());
    }

    /**
     * Products with and without a brand and a link, since a product row shows each only when it's there.
     */
    @Test
    void someProductsHaveBrandsAndLinksAndSomeDont() {
        assertThat(DATA.products()).anyMatch(product -> product.brand() != null)
                .anyMatch(product -> product.brand() == null)
                .anyMatch(product -> !product.link().isEmpty())
                .anyMatch(product -> product.link().isEmpty());
    }

    /**
     * Several stores, so store filters and Periods for one store have something to pick between.
     */
    @Test
    void productsAreSpreadOverSeveralStores() {
        assertThat(DATA.products()).extracting(SeedProduct::store).doesNotContainNull();
        assertThat(DATA.products().stream().map(SeedProduct::store).distinct().count()).isGreaterThanOrEqualTo(4);
    }

    /**
     * Products that share a name across stores, which the grouped list puts in one group. At least one name is at
     * three stores, so a group can hold more than two.
     */
    @Test
    void someNamesAreSharedAcrossStores() {
        Map<String, Long> storesByName = shownProducts().stream()
                .collect(Collectors.groupingBy(SeedProduct::name, Collectors.counting()));
        assertThat(storesByName.values().stream().filter(count -> count > 1).count()).isGreaterThanOrEqualTo(5);
        assertThat(storesByName.values()).contains(3L);
    }

    /**
     * Enough Products for more than four pages, and enough names for more than three pages of groups, so paging can
     * be tried in both lists.
     */
    @Test
    void theListNeedsSeveralPages() {
        assertThat(shownProducts()).hasSizeGreaterThan(4 * PAGE_SIZE);
        assertThat(shownProducts().stream().map(SeedProduct::name).distinct().count())
                .isGreaterThan(3L * PAGE_SIZE);
    }

    /**
     * Every kind of Period: sales and returns, each for one store and for every store.
     */
    @Test
    void periodsIncludeSalesAndReturnsForOneStoreAndForAllStores() {
        assertThat(DATA.periods())
                .extracting(period -> period.type() + (period.store() == null ? " for all stores" : " for one store"))
                .contains("SALE for all stores", "SALE for one store", "RETURN for all stores", "RETURN for one store");
    }

    /**
     * Periods that have ended, that are running now, and that haven't started, so the Periods modal shows each.
     */
    @Test
    void periodsArePastCurrentAndUpcoming() {
        assertThat(DATA.periods()).anyMatch(period -> period.periodEnded().isBefore(NOW))
                .anyMatch(period -> period.periodStarted().isBefore(NOW) && period.periodEnded().isAfter(NOW))
                .anyMatch(period -> period.periodStarted().isAfter(NOW));
    }

    /**
     * A deleted Period, so the Periods modal's deleted Periods have something to show.
     */
    @Test
    void aPeriodIsDeleted() {
        assertThat(DATA.periods()).anyMatch(period -> period.deletedAt() != null);
    }

    /**
     * Every Period lists at least one Price, so none of them opens to an empty list.
     */
    @Test
    void everyPeriodHasMatchingPrices() {
        assertThat(DATA.periods()).allMatch(period ->
                anyPrice(productPrice -> shownPrice(productPrice) && matches(period, productPrice)));
    }

    /**
     * A return Period lists only Prices with cash or points back, and a sale Period only Prices with a discount, so a
     * Period never lists a Price that doesn't fit it.
     */
    @Test
    void returnPeriodPricesHaveReturnsAndSalePeriodPricesHaveDiscounts() {
        for (SeedPeriod period : DATA.periods()) {
            List<SeedPrice> matching = allPrices().stream().filter(productPrice -> matches(period, productPrice))
                    .map(ProductPrice::price).toList();
            if (period.type() == PeriodType.RETURN) {
                assertThat(matching).as(period.name()).allMatch(price -> price.returnPercentage() > 0);
            } else {
                assertThat(matching).as(period.name()).allMatch(price -> price.discountPercentage() > 0);
            }
        }
    }
}
