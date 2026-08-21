package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductDAO extends JpaRepository<Product, Integer> {

    /**
     * Finds all Products with the same name as the given name
     * @param name Name of the Product to find
     * @return A list of all the Products with the given name
     */
    List<Product> findAllByName(String name);

    /**
     * Find all Products by name ascending in the database's 'products' table.
     * @param page Pagination settings
     * @return The list of Products ordered by name ascending
     */
    Page<Product> findAllByOrderByNameAsc(Pageable page);

    /**
     * Finds distinct Product names in the database's 'products' table.
     * @param page Pagination settings
     * @return The list of Product names ordered by name ascending
     */
    @Query("SELECT DISTINCT p.name from Product p ORDER BY p.name")
    Page<String> findDistinctNames(Pageable page);

    /**
     * Finds Products contained within the list of given names.
     * @param names The list of names of Products to find
     * @return The list of Products which have names in the given name list
     */
    List<Product> findByNameIn(List<String> names);
}
