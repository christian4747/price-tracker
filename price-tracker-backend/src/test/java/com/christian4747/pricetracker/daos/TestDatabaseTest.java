package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

// The DAO tests that set createdAt add their rows in the same order as the times they set, so they would still pass
// if setCreatedAt wrote nothing. These tests check it directly.
@DatabaseTest
class TestDatabaseTest {

    private static final Timestamp CREATED_AT = Timestamp.valueOf("2020-01-01 00:00:00");

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

    private Price addPrice(Product product) {
        Price price = new Price();
        price.setProduct(product);
        entityManager.persist(price);
        return price;
    }

    @Test
    void saveFixturesWritesTheEntitiesAndForgetsThem() {
        Product product = addProduct();

        testDatabase.saveFixtures();

        assertThat(entityManager.contains(product)).isFalse();
        assertThat(entityManager.find(Product.class, product.getProductId()).getName()).isEqualTo("Apple");
    }

    @Test
    void setCreatedAtWritesTheTimeForOnlyThatProduct() {
        Product product = addProduct();
        Product other = addProduct();

        testDatabase.setCreatedAt(product, CREATED_AT);
        testDatabase.saveFixtures();

        assertThat(entityManager.find(Product.class, product.getProductId()).getCreatedAt()).isEqualTo(CREATED_AT);
        assertThat(entityManager.find(Product.class, other.getProductId()).getCreatedAt()).isNotEqualTo(CREATED_AT);
    }

    @Test
    void setCreatedAtWritesTheTimeForOnlyThatPrice() {
        Product product = addProduct();
        Price price = addPrice(product);
        Price other = addPrice(product);

        testDatabase.setCreatedAt(price, CREATED_AT);
        testDatabase.saveFixtures();

        assertThat(entityManager.find(Price.class, price.getPriceId()).getCreatedAt()).isEqualTo(CREATED_AT);
        assertThat(entityManager.find(Price.class, other.getPriceId()).getCreatedAt()).isNotEqualTo(CREATED_AT);
    }
}
