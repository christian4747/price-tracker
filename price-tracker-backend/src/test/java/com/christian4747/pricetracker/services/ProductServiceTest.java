package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.PriceTotalPercentages;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.StartedPrice;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.models.dtos.OutgoingProductDTO;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductNameGroupDTO;
import com.christian4747.pricetracker.models.dtos.ResponseAndCount;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @InjectMocks
    private ProductService productService;

    @Mock
    private ProductDAO productDAO;

    @Mock
    private PriceDAO priceDAO;

    @Mock
    private Page<Product> productPage;

    @Mock
    private Page<String> namePage;

    @Mock
    private ProductFilterDTO productFilterDTO;

    @Mock
    private PriceFilterDTO priceFilterDTO;

    @Mock
    private Pageable pageable;

    private Product addedProduct;
    private IncomingProductDTO productDTO;
    private List<Product> productList;
    private List<Product> productList2;

    @BeforeEach
    public void setUp() {
        addedProduct = new Product();
        addedProduct.setName("Product");
        addedProduct.setStore("Store");

        Product addedProduct2 = new Product();
        addedProduct2.setName("Product2");
        addedProduct2.setStore("Store");

        Product addedProduct3 = new Product();
        addedProduct3.setName("Product");
        addedProduct3.setStore("Store2");

        productDTO = new IncomingProductDTO();
        productDTO.setName("Product");
        productDTO.setStore("Store");

        productList = List.of(addedProduct, addedProduct2, addedProduct3);
        productList2 = List.of(addedProduct, addedProduct2);
    }

    @Test
    public void addProduct_productExists_throwException() {
        when(productDAO.findAllByName(anyString())).thenReturn(List.of(addedProduct));

        assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
    }

    @Test
    public void addProduct_deletedProductExists_throwRestoreMessage() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findAllByName(anyString())).thenReturn(List.of(addedProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
        assertEquals("Product already exists as a deleted product. Restore it instead!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void addProduct_productExistsDiffStore_returnProduct() {
        addedProduct.setStore("Store2");

        when(productDAO.findAllByName(anyString())).thenReturn(List.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product", productService.addProduct(productDTO).getName());
    }

    @Test
    public void addProduct_validProduct_returnProduct() {
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product", productService.addProduct(productDTO).getName());
    }

    @Test
    public void addProduct_brand_saveBrand() {
        productDTO.setBrand("Brand");
        when(productDAO.save(any())).thenReturn(addedProduct);

        productService.addProduct(productDTO);

        verify(productDAO).save(argThat(product -> "Brand".equals(product.getBrand())));
    }

    @Test
    public void addProduct_blankBrand_saveNullBrand() {
        productDTO.setBrand("  ");
        when(productDAO.save(any())).thenReturn(addedProduct);

        productService.addProduct(productDTO);

        verify(productDAO).save(argThat(product -> product.getBrand() == null));
    }

    @Test
    public void getRecentBrands_twoBrands_returnTwoBrands() {
        Page<String> brandPage = new PageImpl<>(List.of("Brand2", "Brand"));
        when(productDAO.findDistinctBrands(pageable)).thenReturn(brandPage);

        assertEquals(List.of("Brand2", "Brand"), productService.getRecentBrands(pageable));
    }

    @Test
    public void getRecentStores_twoStores_returnTwoStores() {
        Page<String> storePage = new PageImpl<>(List.of("Store2", "Store"));
        when(productDAO.findDistinctStores(pageable)).thenReturn(storePage);

        assertEquals(List.of("Store2", "Store"), productService.getRecentStores(pageable));
    }

    @Test
    public void permanentlyDeleteProduct_deletedProduct_returnProduct() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findById(1)).thenReturn(Optional.of(addedProduct));
        when(productDAO.permanentlyDeleteById(1)).thenReturn(1);

        assertEquals("Product", productService.permanentlyDeleteProduct(1).getName());
    }

    // The database's foreign key rejects removing a Product that still has Prices
    @Test
    public void permanentlyDeleteProduct_deletedProduct_removePricesBeforeProduct() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findById(1)).thenReturn(Optional.of(addedProduct));
        when(productDAO.permanentlyDeleteById(1)).thenReturn(1);

        productService.permanentlyDeleteProduct(1);

        InOrder removalOrder = inOrder(priceDAO, productDAO);
        removalOrder.verify(priceDAO).permanentlyDeleteByProductId(1);
        removalOrder.verify(productDAO).permanentlyDeleteById(1);
    }

    @Test
    public void permanentlyDeleteProduct_productNotDeleted_throwException() {
        when(productDAO.findById(1)).thenReturn(Optional.of(addedProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.permanentlyDeleteProduct(1));
        assertEquals("Only deleted products can be permanently deleted!", exception.getMessage());
        verify(priceDAO, never()).permanentlyDeleteByProductId(anyInt());
        verify(productDAO, never()).permanentlyDeleteById(anyInt());
    }

    @Test
    public void permanentlyDeleteProduct_nonExistentProduct_throwException() {
        when(productDAO.findById(1)).thenReturn(Optional.empty());

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.permanentlyDeleteProduct(1));
        assertEquals("Product with ID 1 does not exist!", exception.getMessage());
        verify(priceDAO, never()).permanentlyDeleteByProductId(anyInt());
        verify(productDAO, never()).permanentlyDeleteById(anyInt());
    }

    // Throwing rolls back the removed Prices if the Product was restored after it was checked
    @Test
    public void permanentlyDeleteProduct_productNotRemoved_throwException() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findById(1)).thenReturn(Optional.of(addedProduct));
        when(productDAO.permanentlyDeleteById(1)).thenReturn(0);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.permanentlyDeleteProduct(1));
        assertEquals("Only deleted products can be permanently deleted!", exception.getMessage());
    }

    @Test
    public void permanentlyDeleteProduct_productRemovalFails_throwException() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findById(1)).thenReturn(Optional.of(addedProduct));
        when(productDAO.permanentlyDeleteById(1)).thenThrow(new IllegalStateException("Removal failed"));

        assertThrows(IllegalStateException.class, () -> productService.permanentlyDeleteProduct(1));
    }

    // The rollback itself needs a real database, so this guards the annotation that causes it
    @Test
    public void permanentlyDeleteProduct_isTransactional() throws NoSuchMethodException {
        Method permanentlyDeleteProduct = ProductService.class.getMethod("permanentlyDeleteProduct", Integer.class);

        assertTrue(permanentlyDeleteProduct.isAnnotationPresent(Transactional.class));
    }

    @Test
    public void deleteProduct_productExists_returnProduct() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));

        assertEquals("Product", productService.deleteProduct(1).getName());
    }

    @Test
    public void deleteProduct_productNonExistent_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> productService.deleteProduct(1));
    }

    @Test
    public void restoreProduct_deletedProduct_clearDeletedAt() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertNull(productService.restoreProduct(1).getDeletedAt());
        verify(productDAO).save(addedProduct);
    }

    @Test
    public void restoreProduct_deletedProduct_restorePricesDeletedWithProduct() {
        Timestamp deletedAt = Timestamp.valueOf("2026-09-14 00:00:00");
        addedProduct.setDeletedAt(deletedAt);
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.restoreProduct(1);

        verify(priceDAO).restoreByProductIdAndDeletedAt(1, deletedAt);
    }

    @Test
    public void restoreProduct_notDeletedProduct_leavePricesAlone() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productService.restoreProduct(1);

        verify(priceDAO, never()).restoreByProductIdAndDeletedAt(anyInt(), any());
    }

    @Test
    public void restoreProduct_productNonExistent_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> productService.restoreProduct(1));
        verify(productDAO, never()).save(any());
    }

    @Test
    public void getAllProducts_threeProductsOneDeleted_returnTwoProducts() {
        when(productPage.getContent()).thenReturn(productList2);
        when(productPage.getTotalElements()).thenReturn((long) 2);
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("name"));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(productPage);

        assertEquals(2, productService.getAllProductsFiltered(productFilterDTO, priceFilterDTO, pageable).content().size());
    }

    @Test
    public void getAllProducts_threeProductsOneDeleted_returnThreeProducts() {
        when(productPage.getContent()).thenReturn(productList);
        when(productPage.getTotalElements()).thenReturn((long) 3);
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("name"));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(productPage);

        assertEquals(3, productService.getAllProductsFiltered(productFilterDTO, priceFilterDTO, pageable).content().size());
    }

    @Test
    public void getProductById_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> productService.getProductById(1));
    }

    @Test
    public void getProductById_productExists_returnProduct() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.empty());

        assertEquals("Product", productService.getProductById(1).product().getName());
    }

    // A price that started the given number of days ago
    private StartedPrice createPrice(double totalAmount, String currency, double daysAgo) {
        return new StartedPrice(totalAmount, currency, Timestamp.from(Instant.now().minusSeconds((long) (daysAgo * 86400))));
    }

    // Stubs the given started prices from oldest to newest, with the last one as today's price
    private OutgoingProductDTO getProductWithPrices(StartedPrice... prices) {
        Price priceToday = new Price();
        priceToday.setTotalAmount(prices[prices.length - 1].totalAmount());
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.of(priceToday));
        when(priceDAO.findStartedPrices(anyInt())).thenReturn(List.of(prices));

        return productService.getProductById(1);
    }

    @Test
    public void getProductById_twoPrices_averageCountsEachPriceOnce() {
        OutgoingProductDTO product = getProductWithPrices(createPrice(10, "USD", 4), createPrice(20, "USD", 3));

        assertEquals(15, product.averagePrice());
    }

    @Test
    public void getProductById_twoPrices_weightedAverageUsesHowLongEachPriceLasted() {
        // $10 for one day, then $20 for three days up to now
        OutgoingProductDTO product = getProductWithPrices(createPrice(10, "USD", 4), createPrice(20, "USD", 3));

        assertEquals(17.5, product.weightedAveragePrice(), 0.001);
    }

    @Test
    public void getProductById_priceStartedNow_weightedAverageIsItsAmount() {
        OutgoingProductDTO product = getProductWithPrices(createPrice(10, "USD", 0));

        assertEquals(10, product.weightedAveragePrice(), 0.001);
    }

    @Test
    public void getProductById_pricesUseDifferentCurrencies_noAverages() {
        OutgoingProductDTO product = getProductWithPrices(createPrice(10, "USD", 4), createPrice(20, "EUR", 3));

        assertNull(product.averagePrice());
        assertNull(product.weightedAveragePrice());
        assertFalse(product.belowAverage());
    }

    @Test
    public void getProductById_blankAndNullCurrenciesWithUsd_hasAverages() {
        OutgoingProductDTO product = getProductWithPrices(createPrice(10, "", 4), createPrice(20, null, 3), createPrice(30, "USD", 2));

        assertEquals(20, product.averagePrice());
    }

    @Test
    public void getProductById_noStartedPrices_noAverages() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.empty());

        OutgoingProductDTO product = productService.getProductById(1);

        verify(priceDAO, never()).findStartedPrices(anyInt());
        assertNull(product.averagePrice());
        assertNull(product.weightedAveragePrice());
        assertFalse(product.belowAverage());
    }

    @Test
    public void getProductById_priceTodayBelowAverage_belowAverageTrue() {
        assertTrue(getProductWithPrices(createPrice(100, "USD", 4), createPrice(60, "USD", 3)).belowAverage());
    }

    @Test
    public void getProductById_priceTodayAboveAverage_belowAverageFalse() {
        assertFalse(getProductWithPrices(createPrice(60, "USD", 4), createPrice(100, "USD", 3)).belowAverage());
    }

    @Test
    public void getProductById_priceTodayEqualsAverage_belowAverageFalse() {
        assertFalse(getProductWithPrices(createPrice(80, "USD", 4), createPrice(80, "USD", 3)).belowAverage());
    }

    @Test
    public void getProductById_averageDiffersOnlyByRounding_belowAverageFalse() {
        // Three prices of 0.1 average to 0.10000000000000002 with doubles
        OutgoingProductDTO product = getProductWithPrices(createPrice(0.1, "USD", 4), createPrice(0.1, "USD", 3), createPrice(0.1, "USD", 2));

        assertFalse(product.belowAverage());
    }

    @Test
    public void getProductById_priceTodayOneCentBelowAverage_belowAverageTrue() {
        assertTrue(getProductWithPrices(createPrice(1.01, "USD", 4), createPrice(0.99, "USD", 3)).belowAverage());
    }

    // Stubs two prices with the given lows, where a null low means no price started in that window
    private String getCategory(double percentageToday, Double oneYearLow, Double twoYearLow, Double allTimeLow) {
        Price priceToday = new Price();
        priceToday.setTotalPercentage(percentageToday);
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.of(priceToday));
        when(priceDAO.findPriceCount(anyInt())).thenReturn(2);
        when(priceDAO.findPriceTotalPercentages(anyInt(), any(Timestamp.class), any(Timestamp.class)))
                .thenReturn(Optional.of(new PriceTotalPercentages(oneYearLow, twoYearLow, allTimeLow)));

        return productService.getProductById(1).priceCategory();
    }

    @Test
    public void getProductById_priceAtOneYearLow_categoryIsOneYear() {
        assertEquals("one-year", getCategory(10, 10.0, 20.0, 30.0));
    }

    @Test
    public void getProductById_noPricesInLastTwoYearsAndAtAllTimeLow_categoryIsAllTime() {
        assertEquals("all-time", getCategory(30, null, null, 30.0));
    }

    @Test
    public void getProductById_noPricesInLastTwoYearsAndNotAtAllTimeLow_noCategory() {
        assertEquals("", getCategory(10, null, null, 30.0));
    }

    @Test
    public void getProductById_noPricesInLastYearAndAtTwoYearLow_categoryIsTwoYear() {
        assertEquals("two-year", getCategory(20, null, 20.0, 30.0));
    }

    @Test
    public void getProductById_noPricesInLastYearAndNotAtTwoYearLow_noCategory() {
        assertEquals("", getCategory(10, null, 20.0, 30.0));
    }

    @Test
    public void getProductsGroupedByName_twoUniqueNames_returnTwoLists() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(productList);
        when(namePage.getContent()).thenReturn(List.of("Product", "Product2"));
        when(namePage.getTotalElements()).thenReturn(2L);
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("name"));

        assertEquals(2, productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name").count());
    }

    @Test
    public void getProductsGroupedByName_noMatchingNames_returnNoGroupsAndZeroCount() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());
        when(namePage.getContent()).thenReturn(List.of());
        when(namePage.getTotalElements()).thenReturn(0L);
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.unsorted());

        ResponseAndCount<ProductNameGroupDTO> groups = productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name");

        assertEquals(0, groups.count());
        assertTrue(groups.content().isEmpty());
    }

    @Test
    public void getProductsGroupedByName_moreMatchingNamesThanPageSize_countIncludesEveryMatchingName() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of(addedProduct));
        when(namePage.getContent()).thenReturn(List.of("Product"));
        when(namePage.getTotalElements()).thenReturn(7L);
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(1);
        when(pageable.getSort()).thenReturn(Sort.unsorted());

        assertEquals(7, productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name").count());
    }

    @Test
    public void getProductsGroupedByName_descendingNameSort_requestsNamesInThatOrder() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());
        when(namePage.getContent()).thenReturn(List.of());
        when(pageable.getPageNumber()).thenReturn(2);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("name").descending());

        productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name");

        verify(productDAO).findDistinctNames(
                ArgumentMatchers.<Specification<Product>>any(),
                eq(PageRequest.of(2, 10, Sort.by("name").descending()))
        );
    }

    @Test
    public void getProductsGroupedByName_nonNameSort_requestsNamesWithThatSortThenName() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());
        when(namePage.getContent()).thenReturn(List.of());
        when(pageable.getPageNumber()).thenReturn(2);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("createdAt").descending());

        productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name");

        verify(productDAO).findDistinctNames(
                ArgumentMatchers.<Specification<Product>>any(),
                eq(PageRequest.of(2, 10, Sort.by("createdAt").descending().and(Sort.by("name").ascending())))
        );
    }

    @Test
    public void getProductsGroupedByName_productsInADifferentOrder_groupsFollowTheNamesPage() {
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(productList);
        when(namePage.getContent()).thenReturn(List.of("Product2", "Product"));
        when(pageable.getPageNumber()).thenReturn(0);
        when(pageable.getPageSize()).thenReturn(10);
        when(pageable.getSort()).thenReturn(Sort.by("brand").descending());

        ResponseAndCount<ProductNameGroupDTO> groups = productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name");

        assertEquals(List.of("Product2", "Product"), groups.content().stream().map(ProductNameGroupDTO::name).toList());
    }

    @Test
    public void updateProduct_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> productService.updateProduct(1, new IncomingProductDTO()));
    }

    @Test
    public void updateProduct_productExists_returnProduct() {
        productDTO.setName("Product2");

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product2", productService.updateProduct(1, productDTO).getName());
    }

    @Test
    public void updateProduct_blankBrand_saveNullBrand() {
        addedProduct.setBrand("Brand");
        productDTO.setBrand("");

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        productService.updateProduct(1, productDTO);

        verify(productDAO).save(argThat(product -> product.getBrand() == null));
    }

    @Test
    public void updateProduct_otherProductHasNameAndStore_throwException() {
        addedProduct.setProductId(1);
        Product otherProduct = new Product();
        otherProduct.setProductId(2);
        otherProduct.setName("Product");
        otherProduct.setStore("Store");

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.findAllByName("Product")).thenReturn(List.of(addedProduct, otherProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.updateProduct(1, productDTO));
        assertEquals("Product already exists!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void updateProduct_keepOwnNameAndStore_returnProduct() {
        addedProduct.setProductId(1);

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.findAllByName("Product")).thenReturn(List.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product", productService.updateProduct(1, productDTO).getName());
    }

    @Test
    public void restoreProduct_activeProductHasNameAndStore_throwException() {
        addedProduct.setProductId(1);
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        Product activeProduct = new Product();
        activeProduct.setProductId(2);
        activeProduct.setName("Product");
        activeProduct.setStore("Store");

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.findAllByName("Product")).thenReturn(List.of(addedProduct, activeProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.restoreProduct(1));
        assertEquals("Another product with the same name and store already exists!", exception.getMessage());
        verify(productDAO, never()).save(any());
        verify(priceDAO, never()).restoreByProductIdAndDeletedAt(anyInt(), any());
    }

    @Test
    public void restoreProduct_onlyDeletedProductHasNameAndStore_returnProduct() {
        addedProduct.setProductId(1);
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        Product deletedProduct = new Product();
        deletedProduct.setProductId(2);
        deletedProduct.setName("Product");
        deletedProduct.setStore("Store");
        deletedProduct.setDeletedAt(Timestamp.valueOf("2026-09-15 00:00:00"));

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.findAllByName("Product")).thenReturn(List.of(addedProduct, deletedProduct));
        when(productDAO.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertNull(productService.restoreProduct(1).getDeletedAt());
    }

}