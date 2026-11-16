package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.exceptions.ConflictException;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import com.christian4747.pricetracker.services.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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

    @Test
    public void getAllProducts_productDatesInIsoFormat_passInstantsToService() throws Exception {
        // A different moment for each date, so a date passed to the wrong field fails the check
        mockMvc.perform(get("/products")
                        .param("startUpdatedAt", "2025-06-01T00:00:00.000Z")
                        .param("endUpdatedAt", "2025-06-02T00:00:00.000Z")
                        .param("startCreatedAt", "2025-06-03T00:00:00.000Z")
                        .param("endCreatedAt", "2025-06-04T00:00:00.000Z")
                        .param("startDeletedAt", "2025-06-05T00:00:00.000Z")
                        .param("endDeletedAt", "2025-06-06T00:00:00.000Z"))
                .andExpect(status().isOk());

        ProductFilterDTO expectedFilter = new ProductFilterDTO(
                null, null, null, null,
                Instant.parse("2025-06-01T00:00:00Z"), Instant.parse("2025-06-02T00:00:00Z"),
                Instant.parse("2025-06-03T00:00:00Z"), Instant.parse("2025-06-04T00:00:00Z"),
                null,
                Instant.parse("2025-06-05T00:00:00Z"), Instant.parse("2025-06-06T00:00:00Z")
        );
        verify(productService).getAllProductsFiltered(eq(expectedFilter), any(), any());
    }

    // An empty value is what a cleared date field sends
    @ParameterizedTest
    @ValueSource(strings = {"startUpdatedAt", "endUpdatedAt", "startCreatedAt", "endCreatedAt", "startDeletedAt", "endDeletedAt"})
    public void getAllProducts_emptyProductDate_passNoDateToService(String dateParam) throws Exception {
        mockMvc.perform(get("/products").param(dateParam, ""))
                .andExpect(status().isOk());

        ProductFilterDTO expectedFilter = new ProductFilterDTO(null, null, null, null, null, null, null, null, null, null, null);
        verify(productService).getAllProductsFiltered(eq(expectedFilter), any(), any());
    }

    // A date without a time zone could only be read in the server's own, so it's rejected rather than guessed at
    @ParameterizedTest
    @ValueSource(strings = {"startUpdatedAt", "endUpdatedAt", "startCreatedAt", "endCreatedAt", "startDeletedAt", "endDeletedAt"})
    public void getAllProducts_productDateInOtherFormat_return400(String dateParam) throws Exception {
        mockMvc.perform(get("/products").param(dateParam, "2025-06-01 00:00:00"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

        verifyNoInteractions(productService);
    }
}
