package com.christian4747.pricetracker.controllers;

import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import com.christian4747.pricetracker.services.ProductService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@CrossOrigin
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * Gets all the Products in 'products' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Products (default 20)
     */
    @GetMapping
    @RequestMapping("/all")
    public ResponseEntity<List<Product>> getAllProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProducts(pageable).getContent());
    }

    /**
     * Adds a new Product to the 'products' database table.
     * @param productDTO The new Product details
     * @return The newly added Product
     */
    @PostMapping
    public ResponseEntity<Product> addProduct(@RequestBody IncomingProductDTO productDTO) {
        return ResponseEntity.ok(productService.addProduct(productDTO));
    }
}
