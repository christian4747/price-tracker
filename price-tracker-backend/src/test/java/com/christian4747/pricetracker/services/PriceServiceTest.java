package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
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
        priceDTO = new IncomingPriceDTO(1, null, null, null, 1);

        product = new Product();
        product.setProductId(1);

        price = new Price(1, 1, null, null, null, null, null, product);

        Price price1 = new Price(1, 1, null, null, null, null, null, null);
        Price price2 = new Price(2, 2, null, null, null, null, null, null);
        Price price3 = new Price(3, 3, null, null, null, null, null, null);

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
    public void getAllPrices_threePrices_returnThreePrices() {
        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findAll(any(Pageable.class))).thenReturn(pricePage);

        assertEquals(3, priceService.getAllPrices(pageable).size());
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
    public void updatePrice_nonExistentPrice_throwException() {
        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.updatePrice(1, priceDTO));
    }

    @Test
    public void updatePrice_nonExistentProduct_throwException() {
        priceDTO = new IncomingPriceDTO(1, null, null, null, 2);

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
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 2);

        Product product2 = new Product();
        product2.setProductId(2);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product2));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(2, priceService.updatePrice(1, priceDTO).getProduct().getProductId());
    }
}