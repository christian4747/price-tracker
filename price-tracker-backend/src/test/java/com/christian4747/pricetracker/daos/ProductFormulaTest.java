package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class ProductFormulaTest {

    private static final Timestamp OLDER_PAST = Timestamp.valueOf("2020-01-01 00:00:00");
    private static final Timestamp NEWER_PAST = Timestamp.valueOf("2021-01-01 00:00:00");
    private static final Timestamp NEAR_FUTURE = Timestamp.valueOf("2098-01-01 00:00:00");
    private static final Timestamp FAR_FUTURE = Timestamp.valueOf("2099-01-01 00:00:00");

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

    private Price addPrice(Product product, Timestamp priceStarted, double totalAmount, double totalPercentage) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setTotalAmount(totalAmount);
        price.setTotalPercentage(totalPercentage);
        entityManager.persist(price);
        return price;
    }

    /** The formula fields have no getters, so they're read with a query. */
    private <T> T readFormula(Product product, String field, Class<T> type) {
        return entityManager
                .createQuery("SELECT p." + field + " FROM Product p WHERE p.productId = :id", type)
                .setParameter("id", product.getProductId())
                .getSingleResult();
    }

    @Test
    void currentPriceComesFromTheLatestStartedPrice() {
        Product product = addProduct();
        addPrice(product, OLDER_PAST, 10, 1);
        addPrice(product, NEWER_PAST, 20, 2);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentPrice", Double.class)).isEqualTo(20);
    }

    @Test
    void currentPriceIgnoresFuturePrices() {
        Product product = addProduct();
        addPrice(product, NEWER_PAST, 20, 2);
        addPrice(product, NEAR_FUTURE, 30, 3);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentPrice", Double.class)).isEqualTo(20);
    }

    @Test
    void currentPriceIgnoresOtherProducts() {
        Product product = addProduct();
        addPrice(product, OLDER_PAST, 10, 1);
        addPrice(addProduct(), NEWER_PAST, 20, 2);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentPrice", Double.class)).isEqualTo(10);
    }

    @Test
    void currentPriceIgnoresDeletedPrices() {
        Product product = addProduct();
        addPrice(product, OLDER_PAST, 10, 1);
        addPrice(product, NEWER_PAST, 20, 2).setDeletedAt(NEWER_PAST);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentPrice", Double.class)).isEqualTo(10);
    }

    @Test
    void currentDiscountComesFromTheLatestStartedPrice() {
        Product product = addProduct();
        addPrice(product, OLDER_PAST, 10, 1);
        addPrice(product, NEWER_PAST, 20, 2);
        addPrice(product, NEAR_FUTURE, 30, 3);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentDiscount", Double.class)).isEqualTo(2);
    }

    @Test
    void currentDiscountIgnoresDeletedPrices() {
        Product product = addProduct();
        addPrice(product, OLDER_PAST, 10, 1);
        addPrice(product, NEWER_PAST, 20, 2).setDeletedAt(NEWER_PAST);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "currentDiscount", Double.class)).isEqualTo(1);
    }

    @Test
    void timeRemainingComesFromTheNextFuturePrice() {
        Product product = addProduct();
        addPrice(product, NEWER_PAST, 20, 2);
        addPrice(product, FAR_FUTURE, 40, 4);
        addPrice(product, NEAR_FUTURE, 30, 3);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "timeRemaining", Timestamp.class)).isEqualTo(NEAR_FUTURE);
    }

    @Test
    void timeRemainingIgnoresDeletedPrices() {
        Product product = addProduct();
        addPrice(product, NEAR_FUTURE, 30, 3).setDeletedAt(NEWER_PAST);
        addPrice(product, FAR_FUTURE, 40, 4);
        testDatabase.saveFixtures();

        assertThat(readFormula(product, "timeRemaining", Timestamp.class)).isEqualTo(FAR_FUTURE);
    }
}
