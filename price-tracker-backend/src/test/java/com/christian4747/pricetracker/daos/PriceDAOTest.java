package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class PriceDAOTest {

    private static final Timestamp THREE_YEARS_AGO = Timestamp.valueOf("2023-06-01 00:00:00");
    private static final Timestamp TWO_YEARS_AGO = Timestamp.valueOf("2024-06-01 00:00:00");
    private static final Timestamp EIGHTEEN_MONTHS_AGO = Timestamp.valueOf("2024-12-01 00:00:00");
    private static final Timestamp ONE_YEAR_AGO = Timestamp.valueOf("2025-06-01 00:00:00");

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
}
