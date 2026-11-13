package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceLows;
import com.christian4747.pricetracker.models.PricePeriod;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.StartedPrice;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.sql.Timestamp;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class PriceDAOTest {

    private static final Timestamp THREE_YEARS_AGO = Timestamp.valueOf("2023-06-01 00:00:00");
    private static final Timestamp TWO_YEARS_AGO = Timestamp.valueOf("2024-06-01 00:00:00");
    private static final Timestamp EIGHTEEN_MONTHS_AGO = Timestamp.valueOf("2024-12-01 00:00:00");
    private static final Timestamp ONE_YEAR_AGO = Timestamp.valueOf("2025-06-01 00:00:00");
    private static final Timestamp SIX_MONTHS_AGO = Timestamp.valueOf("2025-12-01 00:00:00");
    private static final Timestamp THREE_MONTHS_AGO = Timestamp.valueOf("2026-03-01 00:00:00");
    private static final PricePeriod BLACK_FRIDAY = new PricePeriod(
            Timestamp.valueOf("2026-11-27 00:00:00"), Timestamp.valueOf("2026-11-30 23:59:00"));
    private static final PricePeriod HOLIDAY_SALE = new PricePeriod(
            Timestamp.valueOf("2026-12-15 00:00:00"), Timestamp.valueOf("2026-12-24 23:59:00"));
    private static final PageRequest FIRST_PAGE = PageRequest.of(0, 20);

    @Autowired
    private PriceDAO priceDAO;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TestDatabase testDatabase;

    private Product addProduct() {
        Product product = new Product();
        product.setName("Apple");
        entityManager.persist(product);
        return product;
    }

    /**
     * Adds a price with the given start date and amount paid, and no discount.
     * @param product The product the price belongs to
     * @param priceStarted When the price started
     * @param totalAmount The amount paid
     * @return The added price, which tests can still change before the fixtures are saved
     */
    private Price addPrice(Product product, Timestamp priceStarted, double totalAmount) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setTotalAmount(totalAmount);
        entityManager.persist(price);
        return price;
    }

    private Price addPeriodPrice(Product product, PricePeriod period, Timestamp deletedAt) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(period.priceStarted());
        price.setPriceEnded(period.priceEnded());
        price.setDeletedAt(deletedAt);
        entityManager.persist(price);
        return price;
    }

    private List<PricePeriod> findPeriods() {
        testDatabase.saveFixtures();
        return priceDAO.findDistinctPricePeriods(FIRST_PAGE).getContent();
    }

    /**
     * Saves the fixtures and gets the product's one-year, two-year, and all-time lows.
     * @param product The product to get the lows of
     * @return The product's lows
     */
    private PriceLows findLows(Product product) {
        testDatabase.saveFixtures();
        return priceDAO.findPriceLows(product.getProductId(), ONE_YEAR_AGO, TWO_YEARS_AGO).orElseThrow();
    }

    @Test
    void lowsHaveOnlyAnAllTimeLowWhenEveryPriceIsOlderThanTwoYears() {
        Product product = addProduct();
        addPrice(product, THREE_YEARS_AGO, 5);

        PriceLows lows = findLows(product);

        assertThat(lows.oneYearLow()).isNull();
        assertThat(lows.twoYearLow()).isNull();
        assertThat(lows.allTimeLow()).isEqualTo(5);
    }

    /**
     * The older price is the cheaper one, so the two-year low leaving it out shows the window's start date is used,
     * and the all-time low including it shows the all-time low has no start date.
     */
    @Test
    void lowsHaveNoOneYearLowWhenEveryPriceIsOlderThanOneYear() {
        Product product = addProduct();
        addPrice(product, THREE_YEARS_AGO, 3);
        addPrice(product, EIGHTEEN_MONTHS_AGO, 5);

        PriceLows lows = findLows(product);

        assertThat(lows.oneYearLow()).isNull();
        assertThat(lows.twoYearLow()).isEqualTo(5);
        assertThat(lows.allTimeLow()).isEqualTo(3);
    }

    /**
     * A sale with a big discount can still cost more than a later price with none, such as after the regular price
     * dropped, and the low is whichever costs less.
     */
    @Test
    void lowsAreTheCheapestPricePaidRatherThanTheBiggestDiscount() {
        Product product = addProduct();
        addPrice(product, SIX_MONTHS_AGO, 10.79).setTotalPercentage(0.2);
        addPrice(product, THREE_MONTHS_AGO, 9.99);

        PriceLows lows = findLows(product);

        assertThat(lows.oneYearLow()).isEqualTo(9.99);
        assertThat(lows.twoYearLow()).isEqualTo(9.99);
        assertThat(lows.allTimeLow()).isEqualTo(9.99);
    }

    /**
     * A deleted price was a mistake or is no longer wanted, so even when it's the cheapest it doesn't set any low.
     */
    @Test
    void lowsLeaveOutDeletedPrices() {
        Product product = addProduct();
        addPrice(product, SIX_MONTHS_AGO, 10);
        addPrice(product, THREE_MONTHS_AGO, 1).setDeletedAt(THREE_MONTHS_AGO);

        PriceLows lows = findLows(product);

        assertThat(lows.oneYearLow()).isEqualTo(10);
        assertThat(lows.twoYearLow()).isEqualTo(10);
        assertThat(lows.allTimeLow()).isEqualTo(10);
    }

    @Test
    void findDistinctPricePeriodsPairsDatesFromTheSamePrice() {
        Product product = addProduct();
        addPeriodPrice(product, BLACK_FRIDAY, null);
        addPeriodPrice(product, HOLIDAY_SALE, null);

        assertThat(findPeriods()).containsExactlyInAnyOrder(BLACK_FRIDAY, HOLIDAY_SALE);
    }

    @Test
    void findDistinctPricePeriodsReturnsEachPeriodOnce() {
        addPeriodPrice(addProduct(), BLACK_FRIDAY, null);
        addPeriodPrice(addProduct(), BLACK_FRIDAY, null);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY);
    }

    @Test
    void findDistinctPricePeriodsKeepsPeriodsThatShareADate() {
        PricePeriod sameStartLaterEnd = new PricePeriod(BLACK_FRIDAY.priceStarted(), HOLIDAY_SALE.priceEnded());
        Product product = addProduct();
        addPeriodPrice(product, BLACK_FRIDAY, null);
        addPeriodPrice(product, sameStartLaterEnd, null);

        assertThat(findPeriods()).containsExactlyInAnyOrder(BLACK_FRIDAY, sameStartLaterEnd);
    }

    @Test
    void findDistinctPricePeriodsLeavesOutDeletedPrices() {
        Product product = addProduct();
        addPeriodPrice(product, BLACK_FRIDAY, null);
        addPeriodPrice(product, HOLIDAY_SALE, ONE_YEAR_AGO);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY);
    }

    @Test
    void findDistinctPricePeriodsKeepsAPeriodWhoseNewestPriceIsDeleted() {
        addPeriodPrice(addProduct(), BLACK_FRIDAY, null);
        addPeriodPrice(addProduct(), BLACK_FRIDAY, ONE_YEAR_AGO);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY);
    }

    @Test
    void findDistinctPricePeriodsLeavesOutPricesWithoutAnEndDate() {
        Product product = addProduct();
        addPeriodPrice(product, BLACK_FRIDAY, null);
        addPeriodPrice(product, new PricePeriod(HOLIDAY_SALE.priceStarted(), null), null);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY);
    }

    @Test
    void findDistinctPricePeriodsPutsRecentlyAddedPeriodsFirst() {
        Product product = addProduct();
        // The later sale is added first, so the order can't come from the dates themselves
        Price older = addPeriodPrice(product, HOLIDAY_SALE, null);
        Price newer = addPeriodPrice(product, BLACK_FRIDAY, null);
        testDatabase.setCreatedAt(older, TWO_YEARS_AGO);
        testDatabase.setCreatedAt(newer, ONE_YEAR_AGO);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY, HOLIDAY_SALE);
    }

    @Test
    void findDistinctPricePeriodsLimitsThePageAndCountsEveryPeriod() {
        Product product = addProduct();
        Price older = addPeriodPrice(product, HOLIDAY_SALE, null);
        Price newer = addPeriodPrice(product, BLACK_FRIDAY, null);
        testDatabase.setCreatedAt(older, TWO_YEARS_AGO);
        testDatabase.setCreatedAt(newer, ONE_YEAR_AGO);
        testDatabase.saveFixtures();

        Page<PricePeriod> periods = priceDAO.findDistinctPricePeriods(PageRequest.of(0, 1));

        assertThat(periods.getContent()).containsExactly(BLACK_FRIDAY);
        assertThat(periods.getTotalElements()).isEqualTo(2);
    }

    private Product addStoreProduct(String store) {
        Product product = addProduct();
        product.setStore(store);
        return product;
    }

    private static PricePeriod dates(String priceStarted, String priceEnded) {
        return new PricePeriod(
                Timestamp.valueOf(priceStarted), priceEnded == null ? null : Timestamp.valueOf(priceEnded));
    }

    private List<Price> findWithinBlackFriday(String store) {
        testDatabase.saveFixtures();
        return priceDAO.findAllWithinPeriod(
                FIRST_PAGE, BLACK_FRIDAY.priceStarted(), BLACK_FRIDAY.priceEnded(), store).getContent();
    }

    @Test
    void findAllWithinPeriodIncludesAPriceInsideThePeriod() {
        Price price = addPeriodPrice(addProduct(), dates("2026-11-28 00:00:00", "2026-11-29 00:00:00"), null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).containsExactly(price.getPriceId());
    }

    @Test
    void findAllWithinPeriodIncludesAPriceWithThePeriodsExactDates() {
        Price price = addPeriodPrice(addProduct(), BLACK_FRIDAY, null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).containsExactly(price.getPriceId());
    }

    @Test
    void findAllWithinPeriodLeavesOutAPriceStartingBeforeThePeriod() {
        addPeriodPrice(addProduct(), dates("2026-11-26 23:59:00", "2026-11-29 00:00:00"), null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).isEmpty();
    }

    @Test
    void findAllWithinPeriodLeavesOutAPriceEndingAfterThePeriod() {
        addPeriodPrice(addProduct(), dates("2026-11-28 00:00:00", "2026-12-01 00:00:00"), null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).isEmpty();
    }

    @Test
    void findAllWithinPeriodLeavesOutAPriceWithoutAnEndDate() {
        addPeriodPrice(addProduct(), dates("2026-11-28 00:00:00", null), null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).isEmpty();
    }

    @Test
    void findAllWithinPeriodLeavesOutDeletedPrices() {
        addPeriodPrice(addProduct(), BLACK_FRIDAY, ONE_YEAR_AGO);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).isEmpty();
    }

    @Test
    void findAllWithinPeriodLeavesOutPricesOfDeletedProducts() {
        Product product = addProduct();
        product.setDeletedAt(ONE_YEAR_AGO);
        addPeriodPrice(product, BLACK_FRIDAY, null);

        assertThat(findWithinBlackFriday(null)).extracting(Price::getPriceId).isEmpty();
    }

    @Test
    void findAllWithinPeriodWithAStoreLeavesOutOtherStores() {
        Price cornerShopPrice = addPeriodPrice(addStoreProduct("Corner shop"), BLACK_FRIDAY, null);
        addPeriodPrice(addStoreProduct("Other shop"), BLACK_FRIDAY, null);
        addPeriodPrice(addStoreProduct(null), BLACK_FRIDAY, null);

        assertThat(findWithinBlackFriday("Corner shop"))
                .extracting(Price::getPriceId)
                .containsExactly(cornerShopPrice.getPriceId());
    }

    @Test
    void findAllWithinPeriodWithoutAStoreIncludesEveryStore() {
        Price cornerShopPrice = addPeriodPrice(addStoreProduct("Corner shop"), BLACK_FRIDAY, null);
        Price otherShopPrice = addPeriodPrice(addStoreProduct("Other shop"), BLACK_FRIDAY, null);

        assertThat(findWithinBlackFriday(null))
                .extracting(Price::getPriceId)
                .containsExactlyInAnyOrder(cornerShopPrice.getPriceId(), otherShopPrice.getPriceId());
    }

    @Test
    void findAllWithinPeriodPutsTheNewestStartFirst() {
        Product product = addProduct();
        Price older = addPeriodPrice(product, dates("2026-11-27 00:00:00", "2026-11-28 00:00:00"), null);
        Price newer = addPeriodPrice(product, dates("2026-11-29 00:00:00", "2026-11-30 00:00:00"), null);

        assertThat(findWithinBlackFriday(null))
                .extracting(Price::getPriceId)
                .containsExactly(newer.getPriceId(), older.getPriceId());
    }

    private Price addSalePrice(Product product, Timestamp priceStarted, String description) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setAmount(100);
        price.setDiscountAmount(80);
        price.setTotalAmount(76);
        price.setCurrency("EUR");
        price.setDescription(description);
        entityManager.persist(price);
        return price;
    }

    private List<StartedPrice> findStartedPrices(Product product) {
        testDatabase.saveFixtures();
        return priceDAO.findStartedPrices(product.getProductId());
    }

    // The amounts are all doubles, so values passed to the constructor in the wrong order would still compile
    @Test
    void findStartedPricesReturnsEachValueTheAveragesUse() {
        Product product = addProduct();
        addSalePrice(product, ONE_YEAR_AGO, "Sale");

        assertThat(findStartedPrices(product)).containsExactly(
                new StartedPrice(76, "EUR", ONE_YEAR_AGO, 100, 80, "Sale"));
    }

    // Prices that start together keep the order they were added, so which ones are back to back doesn't change
    @Test
    void findStartedPricesKeepsPricesThatStartTogetherInTheOrderTheyWereAdded() {
        Product product = addProduct();
        Price first = addSalePrice(product, ONE_YEAR_AGO, "First");
        addSalePrice(product, ONE_YEAR_AGO, "Second");
        entityManager.flush();
        // Updating a row moves it to the end of the table, so without a tie-break it would come back last
        first.setDescription("First, updated");

        assertThat(findStartedPrices(product))
                .extracting(StartedPrice::description)
                .containsExactly("First, updated", "Second");
    }
}
