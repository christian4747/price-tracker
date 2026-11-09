package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.services.PriceService;
import com.christian4747.pricetracker.specification.PriceSpecification;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class PriceSpecificationTest {

    private static final Instant THREE_YEARS_AGO = Instant.parse("2023-06-01T00:00:00Z");
    private static final Instant TWO_YEARS_AGO = Instant.parse("2024-06-01T00:00:00Z");
    private static final Instant EIGHTEEN_MONTHS_AGO = Instant.parse("2024-12-01T00:00:00Z");
    private static final Instant ONE_YEAR_AGO = Instant.parse("2025-06-01T00:00:00Z");
    private static final Instant SIX_MONTHS_AGO = Instant.parse("2025-12-01T00:00:00Z");
    private static final Instant DELETED_AT = Instant.parse("2026-01-01T00:00:00Z");
    private static final PriceFilterDTO NO_FILTER = new PriceFilterDTO(null, null, null, null, null, null);

    @Autowired
    private PriceDAO priceDAO;

    @Autowired
    private ProductDAO productDAO;

    @Autowired
    private EntityManager entityManager;

    private Product product;

    @BeforeEach
    void addProduct() {
        product = addProduct("Apple");
    }

    private Product addProduct(String name) {
        Product newProduct = new Product();
        newProduct.setName(name);
        entityManager.persist(newProduct);
        return newProduct;
    }

    private Price addPrice(Product priceProduct, Instant priceStarted, double totalAmount, double totalPercentage, Instant deletedAt) {
        Price price = new Price();
        price.setProduct(priceProduct);
        price.setPriceStarted(Timestamp.from(priceStarted));
        price.setTotalAmount(totalAmount);
        price.setTotalPercentage(totalPercentage);
        price.setDeletedAt(deletedAt == null ? null : Timestamp.from(deletedAt));
        entityManager.persist(price);
        return price;
    }

    private Price addPrice(Instant priceStarted) {
        return addPrice(product, priceStarted, 10, 0, null);
    }

    private Price addDeletedPrice(Instant priceStarted) {
        return addPrice(product, priceStarted, 10, 0, DELETED_AT);
    }

    private PriceFilterDTO startingFrom(Instant startDate) {
        return new PriceFilterDTO(null, null, null, null, startDate, null);
    }

    /** The IDs of the product's prices that match, newest first. */
    private List<Integer> findPriceIds(PriceFilterDTO filter, boolean showDeleted) {
        entityManager.flush();
        entityManager.clear();
        return priceDAO.findAll(
                        PriceSpecification.filterPricesBy(product.getProductId(), filter, showDeleted),
                        PriceService.NEWEST_FIRST)
                .stream().map(Price::getPriceId).toList();
    }

    @Test
    void noFilterFindsEveryLivePriceOfTheProductNewestFirst() {
        Price oldest = addPrice(THREE_YEARS_AGO);
        Price newest = addPrice(ONE_YEAR_AGO);
        Price middle = addPrice(TWO_YEARS_AGO);
        addDeletedPrice(EIGHTEEN_MONTHS_AGO);
        addPrice(addProduct("Banana"), ONE_YEAR_AGO, 10, 0, null);

        assertThat(findPriceIds(NO_FILTER, false))
                .containsExactly(newest.getPriceId(), middle.getPriceId(), oldest.getPriceId());
    }

    @Test
    void showDeletedAlsoFindsDeletedPrices() {
        Price live = addPrice(TWO_YEARS_AGO);
        Price deleted = addDeletedPrice(ONE_YEAR_AGO);

        assertThat(findPriceIds(NO_FILTER, true)).containsExactly(deleted.getPriceId(), live.getPriceId());
    }

    @Test
    void startDateFindsPricesFromThenAndThePriceActiveWhenItBegan() {
        addPrice(THREE_YEARS_AGO);
        Price activeAtStart = addPrice(TWO_YEARS_AGO);
        Price startedOnTheDate = addPrice(EIGHTEEN_MONTHS_AGO);
        Price newest = addPrice(ONE_YEAR_AGO);

        assertThat(findPriceIds(startingFrom(EIGHTEEN_MONTHS_AGO), false))
                .containsExactly(newest.getPriceId(), startedOnTheDate.getPriceId(), activeAtStart.getPriceId());
    }

    @Test
    void startDateAfterEveryPriceStillFindsThePriceActiveThen() {
        addPrice(THREE_YEARS_AGO);
        Price activeAtStart = addPrice(TWO_YEARS_AGO);

        assertThat(findPriceIds(startingFrom(ONE_YEAR_AGO), false)).containsExactly(activeAtStart.getPriceId());
    }

    @Test
    void startDateBeforeEveryPriceFindsNoEarlierPrice() {
        Price only = addPrice(ONE_YEAR_AGO);

        assertThat(findPriceIds(startingFrom(TWO_YEARS_AGO), false)).containsExactly(only.getPriceId());
    }

    @Test
    void priceActiveWhenTheRangeBeganSkipsADeletedNewerPrice() {
        Price activeAtStart = addPrice(THREE_YEARS_AGO);
        addDeletedPrice(TWO_YEARS_AGO);
        Price inRange = addPrice(SIX_MONTHS_AGO);

        assertThat(findPriceIds(startingFrom(ONE_YEAR_AGO), false))
                .containsExactly(inRange.getPriceId(), activeAtStart.getPriceId());
    }

    @Test
    void showDeletedFindsDeletedPricesInTheRangeButNotBeforeIt() {
        Price activeAtStart = addPrice(THREE_YEARS_AGO);
        addDeletedPrice(TWO_YEARS_AGO);
        Price deletedInRange = addDeletedPrice(SIX_MONTHS_AGO);

        assertThat(findPriceIds(startingFrom(ONE_YEAR_AGO), true))
                .containsExactly(deletedInRange.getPriceId(), activeAtStart.getPriceId());
    }

    @Test
    void showDeletedLeavesOutADeletedPriceStartedWithThePriceActiveWhenTheRangeBegan() {
        Price activeAtStart = addPrice(TWO_YEARS_AGO);
        addDeletedPrice(TWO_YEARS_AGO);

        assertThat(findPriceIds(startingFrom(ONE_YEAR_AGO), true)).containsExactly(activeAtStart.getPriceId());
    }

    @Test
    void priceActiveWhenTheRangeBeganIgnoresAnotherProductsPrice() {
        Price activeAtStart = addPrice(THREE_YEARS_AGO);
        addPrice(addProduct("Banana"), TWO_YEARS_AGO, 10, 0, null);

        assertThat(findPriceIds(startingFrom(ONE_YEAR_AGO), false)).containsExactly(activeAtStart.getPriceId());
    }

    @Test
    void endDateLeavesOutPricesStartedOnOrAfterIt() {
        Price older = addPrice(TWO_YEARS_AGO);
        addPrice(ONE_YEAR_AGO);
        addPrice(SIX_MONTHS_AGO);

        PriceFilterDTO filter = new PriceFilterDTO(null, null, null, null, null, ONE_YEAR_AGO);

        assertThat(findPriceIds(filter, false)).containsExactly(older.getPriceId());
    }

    @Test
    void minimumAndMaximumPriceIncludeTheirBoundaries() {
        addPrice(product, THREE_YEARS_AGO, 9.99, 0, null);
        Price atMinimum = addPrice(product, TWO_YEARS_AGO, 10, 0, null);
        Price atMaximum = addPrice(product, EIGHTEEN_MONTHS_AGO, 20, 0, null);
        addPrice(product, ONE_YEAR_AGO, 20.01, 0, null);

        PriceFilterDTO filter = new PriceFilterDTO(10.0, 20.0, null, null, null, null);

        assertThat(findPriceIds(filter, false)).containsExactly(atMaximum.getPriceId(), atMinimum.getPriceId());
    }

    @Test
    void minimumAndMaximumDiscountIncludeTheirBoundaries() {
        addPrice(product, THREE_YEARS_AGO, 10, 0.09, null);
        Price atMinimum = addPrice(product, TWO_YEARS_AGO, 10, 0.1, null);
        Price atMaximum = addPrice(product, EIGHTEEN_MONTHS_AGO, 10, 0.3, null);
        addPrice(product, ONE_YEAR_AGO, 10, 0.31, null);

        PriceFilterDTO filter = new PriceFilterDTO(null, null, 0.1, 0.3, null, null);

        assertThat(findPriceIds(filter, false)).containsExactly(atMaximum.getPriceId(), atMinimum.getPriceId());
    }

    // Doubles can't store most decimals exactly, so a value computed by subtracting, as the app does, can land just past
    // the boundary the user typed: 1 - 0.93 is 0.06999999999999995, and 1 - 0.7 is 0.30000000000000004
    @Test
    void priceBoundsIncludeAmountsStoredJustPastThem() {
        Price justUnderMinimum = addPrice(product, TWO_YEARS_AGO, 1 - 0.93, 0, null);
        Price justOverMaximum = addPrice(product, ONE_YEAR_AGO, 1 - 0.7, 0, null);

        PriceFilterDTO filter = new PriceFilterDTO(0.07, 0.3, null, null, null, null);

        assertThat(findPriceIds(filter, false)).containsExactly(justOverMaximum.getPriceId(), justUnderMinimum.getPriceId());
    }

    @Test
    void discountBoundsIncludePercentagesStoredJustPastThem() {
        Price justUnderMinimum = addPrice(product, TWO_YEARS_AGO, 10, 1 - 0.93, null);
        Price justOverMaximum = addPrice(product, ONE_YEAR_AGO, 10, 1 - 0.7, null);

        PriceFilterDTO filter = new PriceFilterDTO(null, null, 0.07, 0.3, null, null);

        assertThat(findPriceIds(filter, false)).containsExactly(justOverMaximum.getPriceId(), justUnderMinimum.getPriceId());
    }

    @Test
    void priceFiltersApplyToThePriceActiveWhenTheRangeBegan() {
        addPrice(product, TWO_YEARS_AGO, 5, 0, null);
        Price inRange = addPrice(product, SIX_MONTHS_AGO, 15, 0, null);

        PriceFilterDTO filter = new PriceFilterDTO(10.0, null, null, null, ONE_YEAR_AGO, null);

        assertThat(findPriceIds(filter, false)).containsExactly(inRange.getPriceId());
    }

    @Test
    void servicePutsTheNewerOfTwoPricesWithTheSameStartFirst() {
        // Prices that haven't started yet, so the service doesn't add a today's price
        Instant future = Instant.parse("2999-01-01T00:00:00Z");
        Price older = addPrice(future);
        Price newer = addPrice(future);
        entityManager.flush();
        entityManager.clear();

        PriceService priceService = new PriceService(priceDAO, productDAO);
        List<Price> prices = priceService.getPricesByProductId(product.getProductId(), NO_FILTER, false);

        assertThat(prices.stream().map(Price::getPriceId)).containsExactly(newer.getPriceId(), older.getPriceId());
    }

    @Test
    void serviceReturnsEveryPriceWithoutALimit() {
        Instant firstStart = THREE_YEARS_AGO;
        for (int i = 0; i < 25; i++) {
            addPrice(firstStart.plus(i * 30L, ChronoUnit.DAYS));
        }
        entityManager.flush();
        entityManager.clear();

        PriceService priceService = new PriceService(priceDAO, productDAO);
        List<Price> prices = priceService.getPricesByProductId(product.getProductId(), NO_FILTER, false);

        // The service also adds today's price, which repeats one of the prices' IDs
        assertThat(prices.stream().map(Price::getPriceId).distinct()).hasSize(25);
    }
}
