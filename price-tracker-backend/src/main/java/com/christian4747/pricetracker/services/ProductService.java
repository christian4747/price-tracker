package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.ProductDAO;
import com.christian4747.pricetracker.models.Product;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductDAO productDAO;

    @Autowired
    public ProductService(ProductDAO productDAO) {
        this.productDAO = productDAO;
    }

    public Page<Product> getAllProducts(Pageable pageable) {
        return productDAO.findAll(pageable);
    }
}
