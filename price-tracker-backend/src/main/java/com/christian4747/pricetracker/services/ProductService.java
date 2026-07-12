package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.IncomingProductDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProductService {

    private final ProductDAO productDAO;

    @Autowired
    public ProductService(ProductDAO productDAO) {
        this.productDAO = productDAO;
    }

    /**
     * Gets all the Products in 'products' database table. Uses pagination (default 20 per page).
     * @param pageable Pagination settings
     * @return A list of Products (default 20)
     */
    public Page<Product> getAllProducts(Pageable pageable) {
        return productDAO.findAll(pageable);
    }

    /**
     * Adds a new Product to the 'products' database table.
     * @param productDTO The new Product details
     * @return The newly added Product
     */
    public Product addProduct(IncomingProductDTO productDTO) {
        Optional<Product> existingProduct = productDAO.findByName(productDTO.getName());

        if (existingProduct.isPresent()) {
            throw new IllegalArgumentException("Product already exists!");
        }

        Product newProduct = new Product(
                0,
                productDTO.getName(),
                productDTO.getLink(),
                productDTO.getStore(),
                null,
                null,
                null
        );

        return productDAO.save(newProduct);
    }
}
