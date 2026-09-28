package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductDAO extends JpaRepository<Product, Integer>, JpaSpecificationExecutor<Product> {

    /**
     * Finds all Products with the same name as the given name
     * @param name Name of the Product to find
     * @return A list of all the Products with the given name
     */
    List<Product> findAllByName(String name);

    /**
     * Finds distinct Product names in the database's 'products' table.
     * @param page Pagination settings
     * @return The list of distinct Product names
     */
    @Query("SELECT DISTINCT p.name from Product p")
    Page<String> findDistinctNames(Pageable page);
}
