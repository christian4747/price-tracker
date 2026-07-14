package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @InjectMocks
    private ProductService productService;

    @Mock
    private ProductDAO productDAO;

    @Mock
    private Page<Product> productPage;

    @Mock
    private Pageable pageable;

    private Product addedProduct;
    private IncomingProductDTO productDTO;
    private List<Product> productList;

    @BeforeEach
    public void setUp() {
        addedProduct = new Product();
        addedProduct.setName("Product");
        addedProduct.setStore("Store");

        Product addedProduct2 = new Product();
        addedProduct2.setName("Product2");
        addedProduct2.setStore("Store");

        productDTO = new IncomingProductDTO();
        productDTO.setName("Product");
        productDTO.setStore("Store");

        productList = List.of(addedProduct, addedProduct2);
    }

    @Test
    public void addProduct_productExists_throwException() {
        when(productDAO.findByName(anyString())).thenReturn(Optional.of(addedProduct));

        assertThrows(IllegalArgumentException.class, () -> productService.addProduct(productDTO));
    }

    @Test
    public void addProduct_productExistsDiffStore_returnProduct() {
        addedProduct.setStore("Store2");

        when(productDAO.findByName(anyString())).thenReturn(Optional.of(addedProduct));
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product", productService.addProduct(productDTO).getName());
    }

    @Test
    public void addProduct_validProduct_returnProduct() {
        when(productDAO.save(any())).thenReturn(addedProduct);

        assertEquals("Product", productService.addProduct(productDTO).getName());
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
    public void getAllProducts_twoProducts_returnTwoProducts() {
        when(productPage.getContent()).thenReturn(productList);
        when(productDAO.findAll(any(Pageable.class))).thenReturn(productPage);

        assertEquals(2, productService.getAllProducts(pageable).size());
    }

    @Test
    public void getProductById_nonExistentProduct_throwException() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> productService.getProductById(1));
    }

    @Test
    public void getProductById_productExists_returnProduct() {
        when(productDAO.findById(anyInt())).thenReturn(Optional.of(addedProduct));

        assertEquals("Product", productService.getProductById(1).getName());
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

}