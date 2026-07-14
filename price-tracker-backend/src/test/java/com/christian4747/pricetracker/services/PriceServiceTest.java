package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingPriceDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
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

    @Test
    public void addPrice_nonExistentProduct_throwException() {
        IncomingPriceDTO price = new IncomingPriceDTO(1, null, null, null, 1);

        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.addPrice(price));
    }

    @Test
    public void addPrice_validPrice_returnPrice() {
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 1);

        Product product = new Product();
        product.setProductId(1);

        Price price = new Price(1, 1, null, null, null, null, null, product);

        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(1, priceService.addPrice(priceDTO).getProduct().getProductId());
    }

    @Test
    public void deletePrice_existingPrice_returnPrice() {
        Price price = new Price(1, 1, null, null, null, null, null, null);

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
        Price price1 = new Price(1, 1, null, null, null, null, null, null);
        Price price2 = new Price(2, 2, null, null, null, null, null, null);
        Price price3 = new Price(3, 3, null, null, null, null, null, null);

        ArrayList<Price> priceList = new ArrayList<>();
        priceList.add(price1);
        priceList.add(price2);
        priceList.add(price3);

        when(pricePage.getContent()).thenReturn(priceList);
        when(priceDAO.findAll(any(Pageable.class))).thenReturn(pricePage);

        Pageable pageable = mock(Pageable.class);

        assertEquals(3, priceService.getAllPrices(pageable).size());
    }

    @Test
    public void getPriceById_existingPrice_returnPrice() {
        Price price = new Price(1, 1, null, null, null, null, null, null);

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
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 1);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> priceService.updatePrice(1, priceDTO));
    }

    @Test
    public void updatePrice_nonExistentProduct_throwException() {
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 2);

        Product product = new Product();
        product.setProductId(1);

        Price price = new Price(1, 1, null, null, null, null, null, product);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> priceService.updatePrice(1, priceDTO));
    }

    @Test
    public void updatePrice_validPrice_returnNewPrice() {
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 1);

        Product product = new Product();
        product.setProductId(1);

        Price price = new Price(1, 1, null, null, null, null, null, product);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(1, priceService.updatePrice(1, priceDTO).getProduct().getProductId());
    }

    @Test
    public void updatePrice_validPriceDiffProduct_returnNewPrice() {
        IncomingPriceDTO priceDTO = new IncomingPriceDTO(1, null, null, null, 2);

        Product product = new Product();
        product.setProductId(1);

        Price price = new Price(1, 1, null, null, null, null, null, product);

        Product product2 = new Product();
        product2.setProductId(2);

        when(priceDAO.findById(anyInt())).thenReturn(Optional.of(price));
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(product2));
        when(priceDAO.save(any())).thenReturn(price);

        assertEquals(2, priceService.updatePrice(1, priceDTO).getProduct().getProductId());
    }
}