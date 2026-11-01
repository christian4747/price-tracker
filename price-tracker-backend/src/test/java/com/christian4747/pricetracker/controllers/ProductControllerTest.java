package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.services.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @Test
    public void permanentlyDeleteProduct_deletedProduct_returnProduct() throws Exception {
        Product product = new Product();
        product.setProductId(1);
        when(productService.permanentlyDeleteProduct(1)).thenReturn(product);

        mockMvc.perform(delete("/products/1/permanent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productId").value(1));
    }

    @Test
    public void permanentlyDeleteProduct_rejectedProduct_return400WithMessage() throws Exception {
        when(productService.permanentlyDeleteProduct(1))
                .thenThrow(new IllegalArgumentException("Only deleted products can be permanently deleted!"));

        mockMvc.perform(delete("/products/1/permanent"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Only deleted products can be permanently deleted!"));
    }
}
