package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class ProductDAOTest {

    private static final Timestamp OLDER = Timestamp.valueOf("2020-01-01 00:00:00");
    private static final Timestamp NEWER = Timestamp.valueOf("2021-01-01 00:00:00");
    private static final PageRequest FIRST_PAGE = PageRequest.of(0, 20);

    @Autowired
    private ProductDAO productDAO;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TestDatabase testDatabase;

    private Product addProduct(String store, Timestamp deletedAt) {
        Product product = new Product();
        product.setName("Apple");
        product.setStore(store);
        product.setDeletedAt(deletedAt);
        entityManager.persist(product);
        return product;
    }

    private Product addBrandedProduct(String brand, Timestamp deletedAt) {
        Product product = addProduct("Corner shop", deletedAt);
        product.setBrand(brand);
        return product;
    }

    @Test
    void findDistinctStoresLeavesOutDeletedProducts() {
        addProduct("Corner shop", null);
        addProduct("Closed shop", OLDER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctStores(FIRST_PAGE).getContent()).containsExactly("Corner shop");
    }

    @Test
    void findDistinctStoresKeepsAStoreWhoseNewestProductIsDeleted() {
        addProduct("Corner shop", null);
        addProduct("Corner shop", OLDER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctStores(FIRST_PAGE).getContent()).containsExactly("Corner shop");
    }

    @Test
    void findDistinctStoresLeavesOutEmptyStores() {
        addProduct("Corner shop", null);
        addProduct("", null);
        addProduct(null, null);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctStores(FIRST_PAGE).getContent()).containsExactly("Corner shop");
    }

    @Test
    void findDistinctStoresReturnsEachStoreOnce() {
        addProduct("Corner shop", null);
        addProduct("Corner shop", null);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctStores(FIRST_PAGE).getContent()).containsExactly("Corner shop");
    }

    @Test
    void findDistinctStoresPutsRecentlyAddedStoresFirst() {
        Product older = addProduct("Older shop", null);
        Product newer = addProduct("Newer shop", null);
        testDatabase.setCreatedAt(older, OLDER);
        testDatabase.setCreatedAt(newer, NEWER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctStores(FIRST_PAGE).getContent()).containsExactly("Newer shop", "Older shop");
    }

    @Test
    void findDistinctStoresLimitsThePageAndCountsEveryStore() {
        Product older = addProduct("Older shop", null);
        Product newer = addProduct("Newer shop", null);
        testDatabase.setCreatedAt(older, OLDER);
        testDatabase.setCreatedAt(newer, NEWER);
        testDatabase.saveFixtures();

        Page<String> stores = productDAO.findDistinctStores(PageRequest.of(0, 1));

        assertThat(stores.getContent()).containsExactly("Newer shop");
        assertThat(stores.getTotalElements()).isEqualTo(2);
    }

    @Test
    void findDistinctBrandsLeavesOutDeletedProducts() {
        addBrandedProduct("Acme", null);
        addBrandedProduct("Gone", OLDER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctBrands(FIRST_PAGE).getContent()).containsExactly("Acme");
    }

    @Test
    void findDistinctBrandsKeepsABrandWhoseNewestProductIsDeleted() {
        addBrandedProduct("Acme", null);
        addBrandedProduct("Acme", OLDER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctBrands(FIRST_PAGE).getContent()).containsExactly("Acme");
    }

    @Test
    void findDistinctBrandsLeavesOutEmptyBrands() {
        addBrandedProduct("Acme", null);
        addBrandedProduct("", null);
        addBrandedProduct(null, null);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctBrands(FIRST_PAGE).getContent()).containsExactly("Acme");
    }

    @Test
    void findDistinctBrandsReturnsEachBrandOnce() {
        addBrandedProduct("Acme", null);
        addBrandedProduct("Acme", null);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctBrands(FIRST_PAGE).getContent()).containsExactly("Acme");
    }

    @Test
    void findDistinctBrandsPutsRecentlyAddedBrandsFirst() {
        Product older = addBrandedProduct("Older brand", null);
        Product newer = addBrandedProduct("Newer brand", null);
        testDatabase.setCreatedAt(older, OLDER);
        testDatabase.setCreatedAt(newer, NEWER);
        testDatabase.saveFixtures();

        assertThat(productDAO.findDistinctBrands(FIRST_PAGE).getContent()).containsExactly("Newer brand", "Older brand");
    }

    @Test
    void permanentlyDeleteByIdRemovesASoftDeletedProduct() {
        Product product = addProduct("Corner shop", OLDER);
        testDatabase.saveFixtures();

        int removed = productDAO.permanentlyDeleteById(product.getProductId());
        entityManager.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(entityManager.find(Product.class, product.getProductId())).isNull();
    }

    @Test
    void permanentlyDeleteByIdLeavesAProductThatIsNotDeleted() {
        Product product = addProduct("Corner shop", null);
        testDatabase.saveFixtures();

        int removed = productDAO.permanentlyDeleteById(product.getProductId());
        entityManager.clear();

        assertThat(removed).isZero();
        assertThat(entityManager.find(Product.class, product.getProductId())).isNotNull();
    }
}
