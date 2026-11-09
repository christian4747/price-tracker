package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.exceptions.ConflictException;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.services.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    public void permanentlyDeleteProduct_productNotDeleted_return409WithMessage() throws Exception {
        when(productService.permanentlyDeleteProduct(1))
                .thenThrow(new ConflictException("Only deleted products can be permanently deleted!"));

        mockMvc.perform(delete("/products/1/permanent"))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Only deleted products can be permanently deleted!"));
    }

    @Test
    public void postProductById_methodNotSupported_return405ProblemDetail() throws Exception {
        // Spring rejects the request before any controller runs, so this checks Spring's own errors share the format
        mockMvc.perform(post("/products/1"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    public void permanentlyDeleteProduct_unexpectedError_return500WithGenericMessage() throws Exception {
        // The exception's own message can hold internal details, such as SQL, so it mustn't reach the response
        when(productService.permanentlyDeleteProduct(1)).thenThrow(new RuntimeException("SQL error in products"));

        mockMvc.perform(delete("/products/1/permanent"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("Something went wrong on the server."));
    }

    @Test
    public void getAllProducts_startDateInIsoFormat_passInstantToService() throws Exception {
        // The same format the frontend sends: an ISO date in UTC from toISOString()
        mockMvc.perform(get("/products").param("startDate", "2025-11-08T03:00:00.000Z"))
                .andExpect(status().isOk());

        PriceFilterDTO expectedFilter = new PriceFilterDTO(null, null, null, null, Instant.parse("2025-11-08T03:00:00Z"), null);
        verify(productService).getAllProductsFiltered(any(), eq(expectedFilter), any());
    }
}
