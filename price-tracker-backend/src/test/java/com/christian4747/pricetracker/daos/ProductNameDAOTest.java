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

    private Price addCurrentPrice(Product product, double totalAmount, Timestamp priceStarted) {
        Price price = new Price();
        price.setProduct(product);
        price.setPriceStarted(priceStarted);
        price.setTotalAmount(totalAmount);
        entityManager.persist(price);
        return price;
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

    private Product addProductWithBrand(String name, String brand) {
        Product product = addProduct(name, null);
        product.setBrand(brand);
        return product;
    }

    // The creation time is set by Hibernate on insert, so it can only be changed afterwards
    private void addProductCreatedAt(String name, Timestamp createdAt) {
        addProduct(name, null).setCreatedAt(createdAt);
    }

    private void addProductWithActive(String name, boolean active) {
        addProduct(name, null).setActive(active);
    }

    private List<String> findSortedNames(int number, int size, Sort sort) {
        Pageable pageable = PageRequest.of(number, size, sort.and(Sort.by("name").ascending()));
        return findNames(productFilter(null, false), priceFilter(null, null), pageable).getContent();
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
    void priceFilterIgnoresAnotherProductsPriceWithTheSameStartTime() {
        addCurrentPrice(addProduct("Apple", null), 10, PAST);
        addCurrentPrice(addProduct("Banana", null), 100, PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Banana");
        assertThat(names.getTotalElements()).isEqualTo(1);
    }

    @Test
    void priceFilterIgnoresADeletedLatestPrice() {
        Product product = addProduct("Apple", null);
        addCurrentPrice(product, 100, PAST);
        addCurrentPrice(product, 10, LATER_PAST).setDeletedAt(LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Apple");
    }

    @Test
    void priceFilterDoesNotMatchADeletedPrice() {
        Product product = addProduct("Apple", null);
        addCurrentPrice(product, 10, PAST);
        addCurrentPrice(product, 100, LATER_PAST).setDeletedAt(LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).isEmpty();
    }

    @Test
    void priceFilterIgnoresADeletedPriceWithTheSameStartTime() {
        Product product = addProduct("Apple", null);
        addCurrentPrice(product, 10, PAST);
        addCurrentPrice(product, 100, PAST).setDeletedAt(LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, false), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).isEmpty();
    }

    @Test
    void priceFilterUsesTheDeletedPricesOfADeletedProduct() {
        Product product = addProduct("Apple", LATER_PAST);
        addCurrentPrice(product, 10, PAST).setDeletedAt(LATER_PAST);
        addCurrentPrice(product, 100, LATER_PAST).setDeletedAt(LATER_PAST);
        saveFixtures();

        Page<String> names = findNames(productFilter(null, true), priceFilter(50.0, null), page(0, 10));

        assertThat(names.getContent()).containsExactly("Apple");
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

    @Test
    void descendingNameSortReversesTheNames() {
        addProduct("Apple", null);
        addProduct("Banana", null);
        saveFixtures();

        Pageable pageable = PageRequest.of(0, 10, Sort.by("name").descending());

        assertThat(findNames(productFilter(null, false), priceFilter(null, null), pageable).getContent())
                .containsExactly("Banana", "Apple");
    }

    @Test
    void descendingDateSortPutsTheNameWithTheNewestProductOnTheFirstPage() {
        addProductCreatedAt("Apple", PAST);
        addProductCreatedAt("Banana", PAST);
        addProductCreatedAt("Cherry", LATER_PAST);
        saveFixtures();

        assertThat(findSortedNames(0, 1, Sort.by("createdAt").descending())).containsExactly("Cherry");
    }

    @Test
    void ascendingSortPositionsANameByItsLowestValue() {
        addProductWithBrand("Apple", "C");
        addProductWithBrand("Banana", "B");
        addProductWithBrand("Banana", "Z");
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("brand").ascending())).containsExactly("Banana", "Apple");
    }

    @Test
    void descendingSortPositionsANameByItsHighestValue() {
        addProductWithBrand("Apple", "Y");
        addProductWithBrand("Banana", "A");
        addProductWithBrand("Banana", "Z");
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("brand").descending())).containsExactly("Banana", "Apple");
    }

    @Test
    void onlyProductsMatchingTheFiltersPositionAName() {
        addProductWithBrand("Apple", "A").setDeletedAt(PAST);
        addProductWithBrand("Apple", "C");
        addProductWithBrand("Banana", "B");
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("brand").ascending())).containsExactly("Banana", "Apple");
    }

    @Test
    void pagingThroughASortReturnsEveryNameOnceInTheSameOrderAsOneLargePage() {
        addProductWithBrand("Apple", "E");
        addProductWithBrand("Banana", "D");
        addProductWithBrand("Banana", "F");
        addProductWithBrand("Cherry", "C");
        addProductWithBrand("Damson", "B");
        addProductWithBrand("Damson", "G");
        addProductWithBrand("Elderberry", "A");
        saveFixtures();

        Sort sort = Sort.by("brand").ascending();
        List<String> pagedNames = new ArrayList<>();
        pagedNames.addAll(findSortedNames(0, 2, sort));
        pagedNames.addAll(findSortedNames(1, 2, sort));
        pagedNames.addAll(findSortedNames(2, 2, sort));

        assertThat(pagedNames)
                .containsExactly("Elderberry", "Damson", "Cherry", "Banana", "Apple")
                .isEqualTo(findSortedNames(0, 10, sort));
    }

    @Test
    void namesWithEqualValuesKeepAStableOrderBetweenPages() {
        addProductWithBrand("Cherry", "A");
        addProductWithBrand("Apple", "A");
        addProductWithBrand("Banana", "A");
        saveFixtures();

        Sort sort = Sort.by("brand").descending();

        assertThat(findSortedNames(0, 1, sort)).containsExactly("Apple");
        assertThat(findSortedNames(1, 1, sort)).containsExactly("Banana");
        assertThat(findSortedNames(2, 1, sort)).containsExactly("Cherry");
    }

    @Test
    void nameWithSomeEmptyValuesIsPositionedByItsOtherValues() {
        addProductWithBrand("Apple", "B");
        addProductWithBrand("Banana", null);
        addProductWithBrand("Banana", "C");
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("brand").descending())).containsExactly("Banana", "Apple");
    }

    @Test
    void nameWithOnlyEmptyValuesComesLastInADescendingSort() {
        addProductWithBrand("Apple", null);
        addProductWithBrand("Banana", "B");
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("brand").descending())).containsExactly("Banana", "Apple");
    }

    @Test
    void descendingActiveSortPutsANameWithAnyActiveProductFirst() {
        addProductWithActive("Apple", false);
        addProductWithActive("Banana", false);
        addProductWithActive("Banana", true);
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("active").descending())).containsExactly("Banana", "Apple");
    }

    @Test
    void ascendingActiveSortPutsANameWithAnyInactiveProductFirst() {
        addProductWithActive("Apple", true);
        addProductWithActive("Banana", false);
        addProductWithActive("Banana", true);
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("active").ascending())).containsExactly("Banana", "Apple");
    }

    @Test
    void currentPriceSortPositionsANameByItsCurrentPrice() {
        addCurrentPrice(addProduct("Apple", null), 100, PAST);
        addCurrentPrice(addProduct("Banana", null), 10, PAST);
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("currentPrice").ascending())).containsExactly("Banana", "Apple");
    }

    @Test
    void currentDiscountSortPositionsANameByItsCurrentDiscount() {
        addCurrentPrice(addProduct("Apple", null), 100, PAST).setTotalPercentage(0.1);
        addCurrentPrice(addProduct("Banana", null), 100, PAST).setTotalPercentage(0.5);
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("currentDiscount").descending())).containsExactly("Banana", "Apple");
    }

    @Test
    void timeRemainingSortPositionsANameByItsNextPrice() {
        addCurrentPrice(addProduct("Apple", null), 100, Timestamp.valueOf("2999-02-01 00:00:00"));
        addCurrentPrice(addProduct("Banana", null), 100, Timestamp.valueOf("2999-01-01 00:00:00"));
        saveFixtures();

        assertThat(findSortedNames(0, 10, Sort.by("timeRemaining").ascending())).containsExactly("Banana", "Apple");
    }
}
