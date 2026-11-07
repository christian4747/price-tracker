package com.christian4747.pricetracker.models;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PriceTest {

    @Test
    void toStringPrintsTheProductIdInsteadOfTheProduct() {
        Product product = new Product();
        product.setProductId(7);
        Price price = new Price();
        price.setProduct(product);
        product.setPrices(List.of(price));

        assertThat(price.toString())
                .contains("productId=7")
                .doesNotContain("Product{");
    }
}
