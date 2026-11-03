package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PricePeriod;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.Product;
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
    private static final PricePeriod BLACK_FRIDAY = new PricePeriod(
            Timestamp.valueOf("2026-11-27 00:00:00"), Timestamp.valueOf("2026-11-30 23:59:00"));
    private static final PricePeriod HOLIDAY_SALE = new PricePeriod(
            Timestamp.valueOf("2026-12-15 00:00:00"), Timestamp.valueOf("2026-12-24 23:59:00"));
    private static final PageRequest FIRST_PAGE = PageRequest.of(0, 20);

    @Autowired
    private PriceDAO priceDAO;

    @Autowired
    private EntityManager entityManager;

    private Product addProduct() {
        Product product = new Product();
        product.setName("Apple");
        entityManager.persist(product);
        return product;
    }

    private void addPrice(Product product, Timestamp priceStarted, double totalPercentage) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setTotalPercentage(totalPercentage);
        entityManager.persist(price);
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

    /** createdAt is set automatically on insert, so a fixed value has to be written afterwards. */
    private void setCreatedAt(Price price, Timestamp createdAt) {
        entityManager.flush();
        entityManager.createQuery("UPDATE Price p SET p.createdAt = :createdAt WHERE p.priceId = :id")
                .setParameter("createdAt", createdAt)
                .setParameter("id", price.getPriceId())
                .executeUpdate();
    }

    private List<PricePeriod> findPeriods() {
        entityManager.flush();
        entityManager.clear();
        return priceDAO.findDistinctPricePeriods(FIRST_PAGE).getContent();
    }

    private PriceTotalPercentages findPercentages(Product product) {
        entityManager.flush();
        entityManager.clear();
        return priceDAO.findPriceTotalPercentages(product.getProductId(), ONE_YEAR_AGO, TWO_YEARS_AGO).orElseThrow();
    }

    @Test
    void percentagesHaveOnlyAnAllTimeLowWhenEveryPriceIsOlderThanTwoYears() {
        Product product = addProduct();
        addPrice(product, THREE_YEARS_AGO, 5);

        PriceTotalPercentages percentages = findPercentages(product);

        assertThat(percentages.oneYearLow()).isNull();
        assertThat(percentages.twoYearLow()).isNull();
        assertThat(percentages.allTimeLow()).isEqualTo(5);
    }

    @Test
    void percentagesHaveNoOneYearLowWhenEveryPriceIsOlderThanOneYear() {
        Product product = addProduct();
        addPrice(product, THREE_YEARS_AGO, 5);
        addPrice(product, EIGHTEEN_MONTHS_AGO, 3);

        PriceTotalPercentages percentages = findPercentages(product);

        assertThat(percentages.oneYearLow()).isNull();
        assertThat(percentages.twoYearLow()).isEqualTo(3);
        assertThat(percentages.allTimeLow()).isEqualTo(5);
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
        setCreatedAt(older, TWO_YEARS_AGO);
        setCreatedAt(newer, ONE_YEAR_AGO);

        assertThat(findPeriods()).containsExactly(BLACK_FRIDAY, HOLIDAY_SALE);
    }

    @Test
    void findDistinctPricePeriodsLimitsThePageAndCountsEveryPeriod() {
        Product product = addProduct();
        Price older = addPeriodPrice(product, HOLIDAY_SALE, null);
        Price newer = addPeriodPrice(product, BLACK_FRIDAY, null);
        setCreatedAt(older, TWO_YEARS_AGO);
        setCreatedAt(newer, ONE_YEAR_AGO);
        entityManager.flush();
        entityManager.clear();

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
        entityManager.flush();
        entityManager.clear();
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
}
