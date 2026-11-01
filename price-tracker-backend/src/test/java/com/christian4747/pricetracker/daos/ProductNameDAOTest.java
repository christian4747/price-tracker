package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import com.christian4747.pricetracker.specification.ProductSpecification;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class ProductNameDAOTest {

    private static final Timestamp PAST = Timestamp.valueOf("2020-01-01 00:00:00");
    private static final Timestamp LATER_PAST = Timestamp.valueOf("2020-02-01 00:00:00");

    @Autowired
    private ProductDAO productDAO;

    @Autowired
    private EntityManager entityManager;

    private Product addProduct(String name, Timestamp deletedAt) {
        Product product = new Product();
        product.setName(name);
        product.setDeletedAt(deletedAt);
        entityManager.persist(product);
        return product;
    }

    private void addCurrentPrice(Product product, double totalAmount, Timestamp priceStarted) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setTotalAmount(totalAmount);
        entityManager.persist(price);
    }

    private void saveFixtures() {
        entityManager.flush();
        entityManager.clear();
    }

    private ProductFilterDTO productFilter(String name, Boolean deleted) {
        return new ProductFilterDTO(null, name, null, null, null, null, null, null, deleted, null, null);
    }

    private PriceFilterDTO priceFilter(Double minPrice, Double maxPrice) {
        return new PriceFilterDTO(minPrice, maxPrice, null, null, null, null);
    }

    private Page<String> findNames(ProductFilterDTO productFilter, PriceFilterDTO priceFilter, Pageable pageable) {
        Specification<Product> specification = ProductSpecification.filterProductBy(productFilter)
                .and(ProductSpecification.filterProductPriceBy(priceFilter));
        return productDAO.findDistinctNames(specification, pageable);
    }

    private Pageable page(int number, int size) {
        return PageRequest.of(number, size, Sort.by("name").ascending());
    }

    @Test
    void searchFindsANameThatWouldSortOntoALaterPage() {
        addProduct("Apple", null);
        addProduct("Banana", null);
        addProduct("Cherry", null);
        saveFixtures();

        Page<String> names = findNames(productFilter("cherry", false), priceFilter(null, null), page(0, 1));

        assertThat(names.getContent()).containsExactly("Cherry");
        assertThat(names.getTotalElements()).isEqualTo(1);
    }

    @Test
    void searchWithNoMatchesFindsNoNames() {
        addProduct("Apple", null);
        saveFixtures();

        Page<String> names = findNames(productFilter("cherry", false), priceFilter(null, null), page(0, 10));

        assertThat(names.getContent()).isEmpty();
        assertThat(names.getTotalElements()).isZero();
    }

    @Test
    void namesWithOnlyDeletedProductsAreLeftOutWhenDeletedProductsAreHidden() {
        addProduct("Apple", null);
        addProduct("Banana", PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(null, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Apple");
        assertThat(names.getTotalElements()).isEqualTo(1);
    }

    @Test
    void namesWithOnlyDeletedProductsAreIncludedWhenDeletedProductsAreShown() {
        addProduct("Apple", null);
        addProduct("Banana", PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, true), priceFilter(null, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Apple", "Banana");
        assertThat(names.getTotalElements()).isEqualTo(2);
    }

    @Test
    void minimumPriceLimitsTheNamesAndTheCount() {
        addCurrentPrice(addProduct("Apple", null), 10, PAST);
        addCurrentPrice(addProduct("Banana", null), 100, LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Banana");
        assertThat(names.getTotalElements()).isEqualTo(1);
    }

    @Test
    void maximumPriceLimitsTheNamesAndTheCount() {
        addCurrentPrice(addProduct("Apple", null), 10, PAST);
        addCurrentPrice(addProduct("Banana", null), 100, LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(null, 50.0), page(0, 10));

        assertThat(names.getContent()).containsExactly("Apple");
        assertThat(names.getTotalElements()).isEqualTo(1);
    }

    @Test
    void pagingThroughTheResultsReturnsEveryMatchingNameOnce() {
        addProduct("Apple", null);
        addProduct("Apple", null);
        addProduct("Banana", null);
        addProduct("Cherry", null);
        addProduct("Cherry", null);
        addProduct("Damson", null);
        addProduct("Elderberry", null);
        addProduct("Fig", PAST);
        saveFixtures();

        List<String> pagedNames = new ArrayList<>();
        Page<String> names = findNames(productFilter(null, false), priceFilter(null, null), page(0, 2));
        pagedNames.addAll(names.getContent());
        while (names.hasNext()) {
            names = findNames(productFilter(null, false), priceFilter(null, null), names.nextPageable());
            pagedNames.addAll(names.getContent());
        }

        assertThat(pagedNames).containsExactly("Apple", "Banana", "Cherry", "Damson", "Elderberry");
    }
}
