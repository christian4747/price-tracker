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

class DevSeedDataTest {

    private static final Instant NOW = Instant.parse("2026-11-09T03:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Tokyo");
    private static final SeedData DATA = DevSeedData.build(NOW, ZONE);
    // The list shows ten Products, or ten groups of Products sharing a name, on each page
    private static final int PAGE_SIZE = 10;

    private record ProductPrice(SeedProduct product, SeedPrice price) {
    }

    private static List<SeedProduct> shownProducts() {
        return DATA.products().stream().filter(product -> product.deletedAt() == null).toList();
    }

    private static List<ProductPrice> allPrices() {
        return DATA.products().stream()
                .flatMap(product -> product.prices().stream().map(price -> new ProductPrice(product, price)))
                .toList();
    }

    private static boolean anyPrice(Predicate<ProductPrice> predicate) {
        return allPrices().stream().anyMatch(predicate);
    }

    private static boolean shownPrice(ProductPrice productPrice) {
        return productPrice.product().deletedAt() == null && productPrice.price().deletedAt() == null;
    }

    private static Instant yearsAgo(int years) {
        return NOW.atZone(ZONE).minusYears(years).toInstant();
    }

    private static boolean matches(SeedPeriod period, ProductPrice productPrice) {
        SeedPrice price = productPrice.price();
        return price.priceEnded() != null
                && !price.priceStarted().isBefore(period.periodStarted())
                && !price.priceEnded().isAfter(period.periodEnded())
                && (period.store() == null || period.store().equals(productPrice.product().store()));
    }

    @Test
    void sameMomentGivesTheSameData() {
        assertThat(DevSeedData.build(NOW, ZONE)).isEqualTo(DATA);
    }

    @Test
    void productsAreUniqueByNameAndStore() {
        assertThat(DATA.products())
                .extracting(product -> product.name() + " at " + product.store())
                .doesNotHaveDuplicates();
    }

    @Test
    void periodNamesAreUniqueIgnoringCase() {
        assertThat(DATA.periods())
                .extracting(period -> period.name().toLowerCase(Locale.ROOT))
                .doesNotHaveDuplicates();
    }

    @Test
    void seedDoesntOwnTheHandMadeTestRecords() {
        // Reseeding removes records with the seed's names, so it must not share names with hand-made test records
        assertThat(DATA.products()).extracting(SeedProduct::name).noneMatch(name -> name.matches("Product \\d+|\\d+"));
        assertThat(DATA.periods()).extracting(SeedPeriod::name).noneMatch(name -> name.matches("(?i).*test.*|Period \\d+"));
    }

    @Test
    void addedTimesAreNotInTheFuture() {
        assertThat(DATA.products()).allMatch(product -> !product.createdAt().isAfter(NOW));
        assertThat(allPrices()).allMatch(productPrice -> !productPrice.price().createdAt().isAfter(NOW));
        assertThat(DATA.periods()).allMatch(period -> !period.createdAt().isAfter(NOW));
    }

    @Test
    void productsAreUpdatedAfterTheyAreAddedAndBeforeNow() {
        assertThat(DATA.products()).allMatch(product ->
                !product.updatedAt().isBefore(product.createdAt()) && !product.updatedAt().isAfter(NOW));
    }

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

    @Test
    void pricesAreAddedAfterTheirProduct() {
        assertThat(allPrices()).allMatch(productPrice ->
                productPrice.price().createdAt().isAfter(productPrice.product().createdAt()));
    }

    @Test
    void pricesOfADeletedProductAreAddedBeforeItIsDeleted() {
        assertThat(allPrices()).filteredOn(productPrice -> productPrice.product().deletedAt() != null)
                .allMatch(productPrice -> productPrice.price().createdAt().isBefore(productPrice.product().deletedAt()));
    }

    @Test
    void pricesEndAfterTheyStart() {
        assertThat(allPrices()).filteredOn(productPrice -> productPrice.price().priceEnded() != null)
                .allMatch(productPrice -> productPrice.price().priceEnded().isAfter(productPrice.price().priceStarted()));
    }

    @Test
    void noPriceStartsDuringASale() {
        // A Price starting during a sale would cut the sale short
        for (SeedProduct product : DATA.products()) {
            List<SeedPrice> sales = product.prices().stream().filter(SeedPrice::range).toList();
            assertThat(product.prices())
                    .as(product.name() + " at " + product.store())
                    .filteredOn(price -> price.deletedAt() == null)
                    .noneMatch(price -> sales.stream().anyMatch(sale -> price.priceStarted().isAfter(sale.priceStarted())
                            && !price.priceStarted().isAfter(sale.priceEnded())));
        }
    }

    @Test
    void periodsEndAfterTheyStart() {
        assertThat(DATA.periods()).allMatch(period -> period.periodEnded().isAfter(period.periodStarted()));
    }

    @Test
    void percentagesAreBetweenZeroAndOne() {
        assertThat(allPrices()).allMatch(productPrice -> productPrice.price().discountPercentage() >= 0
                && productPrice.price().discountPercentage() < 1
                && productPrice.price().returnPercentage() >= 0
                && productPrice.price().returnPercentage() < 1);
    }

    @Test
    void pricesGoBackAboutThreeYears() {
        assertThat(allPrices()).extracting(productPrice -> productPrice.price().priceStarted())
                .allMatch(started -> started.isAfter(yearsAgo(3).minus(Duration.ofDays(30))))
                .anyMatch(started -> started.isBefore(yearsAgo(3).plus(Duration.ofDays(30))));
    }

    @Test
    void somePricesStartInEachTimeRange() {
        // The chart's 1 year, 2 years, and All time ranges each show different prices
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().priceStarted().isAfter(yearsAgo(1)))).isTrue();
        assertThat(anyPrice(productPrice -> shownPrice(productPrice)
                && productPrice.price().priceStarted().isBefore(yearsAgo(1))
                && productPrice.price().priceStarted().isAfter(yearsAgo(2)))).isTrue();
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().priceStarted().isBefore(yearsAgo(2)))).isTrue();
    }

    @Test
    void someProductsHaveOnlyRecentPrices() {
        // Products tracked for less than a year look the same in every time range
        assertThat(shownProducts()).anyMatch(product -> !product.prices().isEmpty()
                && product.prices().stream().allMatch(price -> price.priceStarted().isAfter(yearsAgo(1))));
    }

    @Test
    void somePricesStartInTheFuture() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && !productPrice.price().range()
                && productPrice.price().priceStarted().isAfter(NOW))).isTrue();
    }

    @Test
    void someSalesAreLiveToday() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().range()
                && productPrice.price().discountPercentage() > 0
                && productPrice.price().priceStarted().isBefore(NOW)
                && productPrice.price().priceEnded().isAfter(NOW))).isTrue();
    }

    @Test
    void somePricesHaveReturns() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().returnPercentage() > 0)).isTrue();
    }

    @Test
    void somePricesEndWithoutAPriceAfterThem() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && !productPrice.price().range()
                && productPrice.price().priceEnded() != null)).isTrue();
    }

    @Test
    void somePricesAreFree() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().amount() == 0)).isTrue();
    }

    @Test
    void somePricesHaveNoCurrency() {
        assertThat(anyPrice(productPrice -> shownPrice(productPrice) && productPrice.price().currency().isEmpty())).isTrue();
    }

    @Test
    void somePricesAreDeletedOnTheirOwn() {
        assertThat(anyPrice(productPrice -> productPrice.product().deletedAt() == null
                && productPrice.price().deletedAt() != null)).isTrue();
    }

    @Test
    void aDeletedProductHasAPriceDeletedBeforeIt() {
        // Restoring it brings back only the Prices deleted with it
        assertThat(anyPrice(productPrice -> productPrice.product().deletedAt() != null
                && productPrice.price().deletedAt() != null)).isTrue();
    }

    @Test
    void someProductsAreInactiveAndSomeAreDeleted() {
        assertThat(DATA.products()).filteredOn(product -> !product.active()).hasSizeGreaterThanOrEqualTo(2);
        assertThat(DATA.products()).filteredOn(product -> product.deletedAt() != null).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void someProductsHaveNoPrices() {
        assertThat(shownProducts()).anyMatch(product -> product.prices().isEmpty());
    }

    @Test
    void someProductsHaveBrandsAndLinksAndSomeDont() {
        assertThat(DATA.products()).anyMatch(product -> product.brand() != null)
                .anyMatch(product -> product.brand() == null)
                .anyMatch(product -> !product.link().isEmpty())
                .anyMatch(product -> product.link().isEmpty());
    }

    @Test
    void productsAreSpreadOverSeveralStores() {
        assertThat(DATA.products()).extracting(SeedProduct::store).doesNotContainNull();
        assertThat(DATA.products().stream().map(SeedProduct::store).distinct().count()).isGreaterThanOrEqualTo(4);
    }

    @Test
    void someNamesAreSharedAcrossStores() {
        Map<String, Long> storesByName = shownProducts().stream()
                .collect(Collectors.groupingBy(SeedProduct::name, Collectors.counting()));
        assertThat(storesByName.values().stream().filter(count -> count > 1).count()).isGreaterThanOrEqualTo(5);
        assertThat(storesByName.values()).contains(3L);
    }

    @Test
    void theListNeedsSeveralPages() {
        assertThat(shownProducts()).hasSizeGreaterThan(4 * PAGE_SIZE);
        assertThat(shownProducts().stream().map(SeedProduct::name).distinct().count())
                .isGreaterThan(3L * PAGE_SIZE);
    }

    @Test
    void periodsIncludeSalesAndReturnsForOneStoreAndForAllStores() {
        assertThat(DATA.periods())
                .extracting(period -> period.type() + (period.store() == null ? " for all stores" : " for one store"))
                .contains("SALE for all stores", "SALE for one store", "RETURN for all stores", "RETURN for one store");
    }

    @Test
    void periodsArePastCurrentAndUpcoming() {
        assertThat(DATA.periods()).anyMatch(period -> period.periodEnded().isBefore(NOW))
                .anyMatch(period -> period.periodStarted().isBefore(NOW) && period.periodEnded().isAfter(NOW))
                .anyMatch(period -> period.periodStarted().isAfter(NOW));
    }

    @Test
    void aPeriodIsDeleted() {
        assertThat(DATA.periods()).anyMatch(period -> period.deletedAt() != null);
    }

    @Test
    void everyPeriodHasMatchingPrices() {
        assertThat(DATA.periods()).allMatch(period ->
                anyPrice(productPrice -> shownPrice(productPrice) && matches(period, productPrice)));
    }

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
