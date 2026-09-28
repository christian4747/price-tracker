package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

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

    @Mock
    private Sort sort;

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
    public void getAllProducts_threeProductsOneDeleted_returnTwoProducts() {
        when(productPage.getContent()).thenReturn(productList2);
        when(productPage.getTotalElements()).thenReturn((long) 2);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Pageable.class))).thenReturn(productPage);

        assertEquals(2, productService.getAllProductsFiltered(productFilterDTO, priceFilterDTO, pageable).content().size());
    }

    @Test
    public void getAllProducts_threeProductsOneDeleted_returnThreeProducts() {
        when(productPage.getContent()).thenReturn(productList);
        when(productPage.getTotalElements()).thenReturn((long) 3);
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

    @Test
    public void getProductsGroupedByName_twoUniqueNames_returnTwoLists() {
        when(productDAO.findDistinctNames(any())).thenReturn(namePage);
        when(productDAO.findAll(ArgumentMatchers.<Specification<Product>>any(), any(Sort.class))).thenReturn(productList);
        when(namePage.getContent()).thenReturn(List.of("Product", "Product2"));
        when(pageable.getPageSize()).thenReturn(1);
        when(pageable.getSort()).thenReturn(sort);

        assertEquals(2, productService.getProductsGroupedByName(productFilterDTO, priceFilterDTO, pageable, "name").count());
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