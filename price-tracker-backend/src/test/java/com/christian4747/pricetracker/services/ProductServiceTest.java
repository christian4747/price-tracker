package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.exceptions.ConflictException;
import com.christian4747.pricetracker.exceptions.NotFoundException;
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
    private ProductFilterDTO productFilterDTO;

    @Mock
    private PriceFilterDTO priceFilterDTO;

    private static final Pageable FIRST_PAGE = PageRequest.of(0, 10, Sort.by("name"));

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

        assertThrows(ConflictException.class, () -> productService.addProduct(productDTO));
    }

    @Test
    public void addProduct_deletedProductExists_throwRestoreMessage() {
        addedProduct.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(productDAO.findAllByName(anyString())).thenReturn(List.of(addedProduct));

        ConflictException exception =
                assertThrows(ConflictException.class, () -> productService.addProduct(productDTO));
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
    public void addProduct_blankName_throwException() {
        productDTO.setName("  ");

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
        assertEquals("Name is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void addProduct_nullName_throwException() {
        productDTO.setName(null);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
        assertEquals("Name is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void addProduct_blankStore_throwException() {
        productDTO.setStore("  ");

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
        assertEquals("Store is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void addProduct_nullStore_throwException() {
        productDTO.setStore(null);

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
        assertEquals("Store is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
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
        when(productDAO.findDistinctBrands(FIRST_PAGE)).thenReturn(brandPage);

        assertEquals(List.of("Brand2", "Brand"), productService.getRecentBrands(FIRST_PAGE));
    }

    @Test
    public void getRecentStores_twoStores_returnTwoStores() {
        Page<String> storePage = new PageImpl<>(List.of("Store2", "Store"));
        when(productDAO.findDistinctStores(FIRST_PAGE)).thenReturn(storePage);

        assertEquals(List.of("Store2", "Store"), productService.getRecentStores(FIRST_PAGE));
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

        ConflictException exception =
                assertThrows(ConflictException.class, () -> productService.permanentlyDeleteProduct(1));
        assertEquals("Only deleted products can be permanently deleted!", exception.getMessage());
        verify(priceDAO, never()).permanentlyDeleteByProductId(anyInt());
        verify(productDAO, never()).permanentlyDeleteById(anyInt());
    }

    @Test
    public void permanentlyDeleteProduct_nonExistentProduct_throwException() {
        when(productDAO.findById(1)).thenReturn(Optional.empty());

        NotFoundException exception =
                assertThrows(NotFoundException.class, () -> productService.permanentlyDeleteProduct(1));
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

        ConflictException exception =
                assertThrows(ConflictException.class, () -> productService.permanentlyDeleteProduct(1));
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

        assertThrows(NotFoundException.class, () -> productService.deleteProduct(1));
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

        assertThrows(NotFoundException.class, () -> productService.restoreProduct(1));
        verify(productDAO, never()).save(any());
    }

    @Test
    public void getAllProducts_threeProductsOneDeleted_returnTwoProducts() {
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(productList2, FIRST_PAGE, 2));

        assertEquals(2, productService.getAllProductsFiltered(productFilterDTO, priceFilterDTO, FIRST_PAGE).content().size());
    }

    @Test
    public void getAllProducts_threeProductsOneDeleted_returnThreeProducts() {
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(productList, FIRST_PAGE, 3));

        assertEquals(3, productService.getAllProductsFiltered(productFilterDTO, priceFilterDTO, FIRST_PAGE).content().size());
    }

    @Test
    public void getProductById_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.getProductById(1));
    }

    @Test
    public void getProductById_productExists_returnProduct() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.empty());

        assertEquals("Product", productService.getProductById(1).product().getName());
    }

    // A full price, with no discount or description, that started the given number of days ago
    private StartedPrice createPrice(double totalAmount, String currency, double daysAgo) {
        return new StartedPrice(totalAmount, currency, daysAgo(daysAgo), totalAmount, totalAmount, "");
    }

    // A USD price with the given base amount, discounted amount, and description, which together tell its sale apart
    private StartedPrice createSalePrice(double amount, double discountAmount, String description, double totalAmount, double daysAgo) {
        return new StartedPrice(totalAmount, "USD", daysAgo(daysAgo), amount, discountAmount, description);
    }

    private static Timestamp daysAgo(double days) {
        return Timestamp.from(Instant.now().minusSeconds((long) (days * 86400)));
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

    // A return inside a sale splits it into three rows, and the rows on either side of the return have the same price
    @Test
    public void getProductById_returnInsideASale_averageCountsEachPriceInTheSaleOnce() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale", 80, 10),
                createSalePrice(100, 80, "Sale", 76, 8),
                createSalePrice(100, 80, "Sale", 80, 6),
                createSalePrice(100, 100, "", 100, 4));

        // $80, $76, and $100
        assertEquals(85.333, product.averagePrice(), 0.001);
    }

    @Test
    public void getProductById_samePriceInSalesThatAreNotBackToBack_averageCountsBoth() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale", 80, 6),
                createSalePrice(100, 100, "", 100, 4),
                createSalePrice(100, 80, "Sale", 80, 2));

        assertEquals(86.667, product.averagePrice(), 0.001);
    }

    @Test
    public void getProductById_backToBackPricesWithDifferentDescriptions_averageCountsBoth() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale A", 80, 6),
                createSalePrice(100, 80, "Sale B", 80, 4),
                createSalePrice(100, 100, "", 100, 2));

        assertEquals(86.667, product.averagePrice(), 0.001);
    }

    @Test
    public void getProductById_backToBackPricesWithDifferentBaseAmounts_averageCountsBoth() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale", 80, 6),
                createSalePrice(90, 80, "Sale", 80, 4),
                createSalePrice(100, 100, "", 100, 2));

        assertEquals(86.667, product.averagePrice(), 0.001);
    }

    // The second price has a smaller discount and a return that brings its total to the same price
    @Test
    public void getProductById_backToBackPricesWithDifferentDiscounts_averageCountsBoth() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale", 80, 6),
                createSalePrice(100, 84, "Sale", 80, 4),
                createSalePrice(100, 100, "", 100, 2));

        assertEquals(86.667, product.averagePrice(), 0.001);
    }

    @Test
    public void getProductById_backToBackPricesWithNullAndEmptyDescriptions_averageCountsOnce() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, null, 80, 6),
                createSalePrice(100, 80, "", 80, 4),
                createSalePrice(100, 100, "", 100, 2));

        assertEquals(90, product.averagePrice(), 0.001);
    }

    // A price without a currency displays as USD, so it's the same sale as a USD price
    @Test
    public void getProductById_backToBackPricesWithBlankAndUsdCurrencies_averageCountsOnce() {
        OutgoingProductDTO product = getProductWithPrices(
                createPrice(80, "", 6),
                createPrice(80, "USD", 4),
                createPrice(100, "USD", 2));

        assertEquals(90, product.averagePrice(), 0.001);
    }

    // Splitting doesn't change how long each price lasted, so every row still counts by its duration
    @Test
    public void getProductById_returnInsideASale_weightedAverageCountsEveryRow() {
        // $80, $76, and $80 for two days each, then $100 for four days up to now
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 80, "Sale", 80, 10),
                createSalePrice(100, 80, "Sale", 76, 8),
                createSalePrice(100, 80, "Sale", 80, 6),
                createSalePrice(100, 100, "", 100, 4));

        assertEquals(87.2, product.weightedAveragePrice(), 0.001);
    }

    // Counting the sale's $60 rows twice would make the average $73.75, which today's $75 isn't below
    @Test
    public void getProductById_priceTodayBelowAverageCountingEachPriceInASaleOnce_belowAverageTrue() {
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(100, 60, "Sale", 60, 8),
                createSalePrice(100, 60, "Sale", 60, 6),
                createSalePrice(100, 100, "", 100, 4),
                createSalePrice(100, 75, "Other sale", 75, 2));

        assertTrue(product.belowAverage());
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
        // Three prices of 0.1 average to 0.10000000000000002 with doubles. Each is its own sale, so all three count
        OutgoingProductDTO product = getProductWithPrices(
                createSalePrice(0.1, 0.1, "Sale A", 0.1, 4),
                createSalePrice(0.1, 0.1, "Sale B", 0.1, 3),
                createSalePrice(0.1, 0.1, "Sale C", 0.1, 2));

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
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of("Product", "Product2"), FIRST_PAGE, 2));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(productList);

        assertEquals(2, productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, FIRST_PAGE, "name").count());
    }

    @Test
    public void getProductsGroupedByName_noMatchingNames_returnNoGroupsAndZeroCount() {
        Pageable unsorted = PageRequest.of(0, 10);
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), unsorted, 0));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());

        ResponseAndCount<ProductNameGroupDTO> groups = productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, unsorted, "name");

        assertEquals(0, groups.count());
        assertTrue(groups.content().isEmpty());
    }

    @Test
    public void getProductsGroupedByName_moreMatchingNamesThanPageSize_countIncludesEveryMatchingName() {
        Pageable oneName = PageRequest.of(0, 1);
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of("Product"), oneName, 7));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of(addedProduct));

        assertEquals(7, productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, oneName, "name").count());
    }

    @Test
    public void getProductsGroupedByName_descendingNameSort_requestsNamesInThatOrder() {
        Pageable thirdPageByNameDescending = PageRequest.of(2, 10, Sort.by("name").descending());
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());

        productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, thirdPageByNameDescending, "name");

        verify(productDAO).findDistinctNames(
                ArgumentMatchers.<Specification<Product>>any(),
                eq(PageRequest.of(2, 10, Sort.by("name").descending()))
        );
    }

    @Test
    public void getProductsGroupedByName_nonNameSort_requestsNamesWithThatSortThenName() {
        Pageable thirdPageNewestFirst = PageRequest.of(2, 10, Sort.by("createdAt").descending());
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(List.of());

        productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, thirdPageNewestFirst, "name");

        verify(productDAO).findDistinctNames(
                ArgumentMatchers.<Specification<Product>>any(),
                eq(PageRequest.of(2, 10, Sort.by("createdAt").descending().and(Sort.by("name").ascending())))
        );
    }

    @Test
    public void getProductsGroupedByName_productsInADifferentOrder_groupsFollowTheNamesPage() {
        Pageable byBrandDescending = PageRequest.of(0, 10, Sort.by("brand").descending());
        when(productDAO.findDistinctNames(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of("Product2", "Product"), byBrandDescending, 2));
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(productList);

        ResponseAndCount<ProductNameGroupDTO> groups = productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, byBrandDescending, "name");

        assertEquals(List.of("Product2", "Product"), groups.content().stream().map(ProductNameGroupDTO::name).toList());
    }

    @Test
    public void updateProduct_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.updateProduct(1, new IncomingProductDTO()));
    }

    @Test
    public void updateProduct_productExists_returnProduct() {
        productDTO.setName("Product2");

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product2", productService.updateProduct(1, productDTO).getName());
    }

    @Test
    public void updateProduct_blankName_throwException() {
        productDTO.setName("");
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.updateProduct(1, productDTO));
        assertEquals("Name is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
    }

    @Test
    public void updateProduct_blankStore_throwException() {
        productDTO.setStore("");
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> productService.updateProduct(1, productDTO));
        assertEquals("Store is required!", exception.getMessage());
        verify(productDAO, never()).save(any());
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

        ConflictException exception =
                assertThrows(ConflictException.class, () -> productService.updateProduct(1, productDTO));
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

        ConflictException exception =
                assertThrows(ConflictException.class, () -> productService.restoreProduct(1));
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