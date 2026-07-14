package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductDAO extends JpaRepository<Product, Integer> {

    /**
     * Finds whether a Product with the same name exists in the database's 'products' table.
     * @param name Name of the Product to find
     * @return An optional which may or may not have the Product
     */
    Optional<Product> findByName(String name);

}
