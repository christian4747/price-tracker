package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/** Product.prices is lazy, so this needs a real database to tell whether printing a product loads them. */
@DatabaseTest
class ProductToStringTest {

    @Autowired
    private ProductDAO productDAO;

    @Autowired
    private EntityManager entityManager;

    @Test
    void toStringDoesNotLoadThePrices() {
        Product product = new Product();
        product.setName("Apple");
        entityManager.persist(product);
        Price price = new Price();
        price.setProduct(product);
        entityManager.persist(price);
        entityManager.flush();
        entityManager.clear();

        Product loaded = productDAO.findById(product.getProductId()).orElseThrow();
        loaded.toString();

        assertThat(Hibernate.isInitialized(loaded.getPrices())).isFalse();
    }
}
