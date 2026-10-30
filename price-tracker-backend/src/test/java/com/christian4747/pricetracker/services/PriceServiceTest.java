package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import com.christian4747.pricetracker.models.dtos.IncomingPriceRangeDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PriceServiceTest {

    @InjectMocks
    private PriceService priceService;

    @Mock
    private PriceDAO priceDAO;

    @Mock
    private ProductDAO productDAO;

    @Mock
    private Page<Price> pricePage;

    @Mock
    private Pageable pageable;

    private IncomingPriceDTO priceDTO;
    private Price price;
    private Product product;
    private List<Price> priceList;

    @BeforeEach
    public void setUp() {
        priceDTO = new IncomingPriceDTO();
        priceDTO.setAmount(1);
        priceDTO.setProductId(1);

        product = new Product();
        product.setProductId(1);

        price = new Price();
        price.setPriceId(1);
        price.setAmount(1);
        price.setProduct(product);

        Price price1 = new Price();
        price1.setPriceId(1);
        price1.setAmount(1);

        Price price2 = new Price();
        price2.setPriceId(2);
        price2.setAmount(2);

        Price price3 = new Price();
        price3.setPriceId(3);
        price3.setAmount(3);

        priceList = List.of(price1, price2, price3);
    }

    @Test
    public void addPrice_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.addPrice(priceDTO));
    }

    @Test
    public void addPrice_validPrice_returnPrice() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(1, priceService.addPrice(priceDTO).getProduct().getProductId());
    }

    @Test
    public void addPrice_endBeforeStart_throwException() {
        priceDTO.setPriceStarted(Timestamp.valueOf("2026-09-10 12:00:00"));
        priceDTO.setPriceEnded(Timestamp.valueOf("2026-09-05 12:00:00"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> priceService.addPrice(priceDTO));
        assertEquals("Price end date must be after its start date!", ex.getMessage());
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void addPrice_endEqualsStart_throwException() {
        priceDTO.setPriceStarted(Timestamp.valueOf("2026-09-10 12:00:00"));
        priceDTO.setPriceEnded(Timestamp.valueOf("2026-09-10 12:00:00"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> priceService.addPrice(priceDTO));
        assertEquals("Price end date must be after its start date!", ex.getMessage());
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void addPrice_endAfterStart_returnPrice() {
        priceDTO.setPriceStarted(Timestamp.valueOf("2026-09-05 12:00:00"));
        priceDTO.setPriceEnded(Timestamp.valueOf("2026-09-10 12:00:00"));
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(1, priceService.addPrice(priceDTO).getProduct().getProductId());
    }

    private IncomingPriceRangeDTO createRangeDTO() {
        IncomingPriceRangeDTO rangeDTO = new IncomingPriceRangeDTO();
        rangeDTO.setAmount(100);
        rangeDTO.setCurrency("USD");
        rangeDTO.setDescription("Sale");
        rangeDTO.setDiscountAmount(80);
        rangeDTO.setDiscountPercentage(0.2);
        rangeDTO.setPriceStarted(Timestamp.valueOf("2026-09-05 12:00:00"));
        rangeDTO.setPriceEnded(Timestamp.valueOf("2026-09-10 12:00:00"));
        rangeDTO.setProductId(1);
        rangeDTO.setReturnAmount(4);
        rangeDTO.setReturnPercentage(0.05);
        return rangeDTO;
    }

    // Saving returns the Price it was given, so the test can check what would be saved
    private List<Price> saveRange(IncomingPriceRangeDTO rangeDTO) {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product));
        when(priceDAO.save(any())).thenAnswer(returnsFirstArg());

        return priceService.addPriceRange(rangeDTO);
    }

    @Test
    public void addPriceRange_validRange_firstPriceKeepsSubmittedValues() {
        Price firstPrice = saveRange(createRangeDTO()).getFirst();

        assertEquals(80, firstPrice.getDiscountAmount());
        assertEquals(0.2, firstPrice.getDiscountPercentage());
        assertEquals(4, firstPrice.getReturnAmount());
        assertEquals(0.05, firstPrice.getReturnPercentage());
        assertEquals("Sale", firstPrice.getDescription());
        assertEquals(Timestamp.valueOf("2026-09-05 12:00:00"), firstPrice.getPriceStarted());
        assertEquals(Timestamp.valueOf("2026-09-10 12:00:00"), firstPrice.getPriceEnded());
    }

    @Test
    public void addPriceRange_validRange_endPriceStartsWhenFirstPriceEnds() {
        Price endPrice = saveRange(createRangeDTO()).getLast();

        assertEquals(Timestamp.valueOf("2026-09-10 12:00:00"), endPrice.getPriceStarted());
        assertNull(endPrice.getPriceEnded());
    }

    @Test
    public void addPriceRange_validRange_endPriceReturnsToFullAmount() {
        Price endPrice = saveRange(createRangeDTO()).getLast();

        assertEquals(100, endPrice.getAmount());
        assertEquals(100, endPrice.getDiscountAmount());
        assertEquals(100, endPrice.getTotalAmount());
        assertEquals(0, endPrice.getTotalPercentage());
    }

    @Test
    public void addPriceRange_validRange_endPriceResetsPercentagesAndReturn() {
        Price endPrice = saveRange(createRangeDTO()).getLast();

        assertEquals(0, endPrice.getDiscountPercentage());
        assertEquals(0, endPrice.getReturnAmount());
        assertEquals(0, endPrice.getReturnPercentage());
    }

    @Test
    public void addPriceRange_useEndDateDesc_endPriceKeepsDescription() {
        IncomingPriceRangeDTO rangeDTO = createRangeDTO();
        rangeDTO.setUseEndDateDesc(true);

        assertEquals("Sale", saveRange(rangeDTO).getLast().getDescription());
    }

    @Test
    public void addPriceRange_notUseEndDateDesc_endPriceHasEmptyDescription() {
        assertEquals("", saveRange(createRangeDTO()).getLast().getDescription());
    }

    @Test
    public void addPriceRange_noEndDate_throwException() {
        IncomingPriceRangeDTO rangeDTO = createRangeDTO();
        rangeDTO.setPriceEnded(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> priceService.addPriceRange(rangeDTO));
        assertEquals("Price end date is required!", ex.getMessage());
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void addPriceRange_endNotAfterStart_throwException() {
        IncomingPriceRangeDTO rangeDTO = createRangeDTO();
        rangeDTO.setPriceEnded(rangeDTO.getPriceStarted());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> priceService.addPriceRange(rangeDTO));
        assertEquals("Price end date must be after its start date!", ex.getMessage());
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void addPriceRange_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.addPriceRange(createRangeDTO()));
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void addPriceRange_endPriceFails_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product));
        when(priceDAO.save(any())).thenReturn(price).thenThrow(new IllegalStateException("Save failed"));

        assertThrows(IllegalStateException.class, () -> priceService.addPriceRange(createRangeDTO()));
    }

    // The rollback itself needs a real database, so this guards the annotation that causes it
    @Test
    public void addPriceRange_isTransactional() throws NoSuchMethodException {
        Method addPriceRange = PriceService.class.getMethod("addPriceRange", IncomingPriceRangeDTO.class);

        assertTrue(addPriceRange.isAnnotationPresent(Transactional.class));
    }

    @Test
    public void deletePrice_existingPrice_returnPrice() {
        when(priceDAO.findById(any())).thenReturn(Optional.of(price));

        assertEquals(1, priceService.deletePrice(1).getPriceId());
    }

    @Test
    public void deletePrice_nonExistentPrice_throwException() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.deletePrice(1));
    }

    @Test
    public void restorePrice_deletedPrice_clearDeletedAt() {
        price.setDeletedAt(Timestamp.valueOf("2026-09-14 00:00:00"));
        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(priceDAO.save(any(Price.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertNull(priceService.restorePrice(1).getDeletedAt());
        verify(priceDAO).save(price);
    }

    @Test
    public void restorePrice_nonExistentPrice_throwException() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.restorePrice(1));
        verify(priceDAO, never()).save(any());
    }

    @Test
    public void getAllPrices_threePrices_returnThreePrices() {
        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findByDeletedAtNull(any(Pageable.class))).thenReturn(pricePage);

        assertEquals(3, priceService.getAllPrices(pageable, false).size());
    }

    @Test
    public void getAllPrices_threePrices_returnThreePricesShowDeleted() {
        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findAll(any(Pageable.class))).thenReturn(pricePage);

        assertEquals(3, priceService.getAllPrices(pageable, true).size());
    }

    @Test
    public void getPriceById_existingPrice_returnPrice() {
        when(priceDAO.findById(any())).thenReturn(Optional.of(price));

        assertEquals(1, priceService.getPriceById(1).getPriceId());
    }

    @Test
    public void getPriceById_nonExistentPrice_throwException() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.getPriceById(1));
    }

    @Test
    public void getPricesByProductId_threePrices_returnThreePricesAndToday() {
        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.of(price));
        when(priceDAO.findByProductProductIdOrderByPriceStartedDesc(pageable, 0)).thenReturn(pricePage);

        assertEquals(4, priceService.getPricesByProductId(pageable, 0, false).size());
    }

    @Test
    public void getPricesByProductId_threePrices_returnThreePricesAndTodayWithDeleted() {
        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findPriceToday(anyInt())).thenReturn(Optional.of(price));
        when(priceDAO.findByProductProductIdOrderByPriceStartedDescDeleted(pageable, 0)).thenReturn(pricePage);

        assertEquals(4, priceService.getPricesByProductId(pageable, 0, true).size());
    }

    @Test
    public void updatePrice_nonExistentPrice_throwException() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.updatePrice(1, priceDTO));
    }

    @Test
    public void updatePrice_nonExistentProduct_throwException() {
        priceDTO = new IncomingPriceDTO();
        priceDTO.setAmount(1);
        priceDTO.setProductId(2);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.updatePrice(1, priceDTO));
    }

    @Test
    public void updatePrice_validPrice_returnNewPrice() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(1, priceService.updatePrice(1, priceDTO).getProduct().getProductId());
    }

    @Test
    public void updatePrice_validPriceDiffProduct_returnNewPrice() {
        IncomingPriceDTO priceDTO = new IncomingPriceDTO();
        priceDTO.setAmount(1);
        priceDTO.setProductId(2);

        Product product2 = new Product();
        product2.setProductId(2);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product2));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(2, priceService.updatePrice(1, priceDTO).getProduct().getProductId());
    }
}