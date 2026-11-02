package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductDAO extends JpaRepository<Product, Integer>, JpaSpecificationExecutor<Product>, ProductNameDAO {

    /**
     * Finds all Products with the same name as the given name
     * @param name Name of the Product to find
     * @return A list of all the Products with the given name
     */
    List<Product> findAllByName(String name);

    /**
     * Checks whether any non-deleted Product uses the given store.
     * @param store Store to check
     * @return Whether a non-deleted Product uses the store
     */
    boolean existsByStoreAndDeletedAtNull(String store);

    /**
     * Gets a distinct list of the brands of recently added non-deleted Products.
     * @param pageable Pagination settings
     * @return A distinct list of recently used Product brands (default 20)
     */
    @Query(value = "SELECT p.brand FROM Product p WHERE p.productId IN (SELECT MAX(p.productId) FROM Product p WHERE p.brand <> '' AND p.deletedAt IS NULL GROUP BY p.brand) ORDER BY p.createdAt DESC")
    Page<String> findDistinctBrands(Pageable pageable);

    /**
     * Gets a distinct list of the stores of recently added non-deleted Products.
     * @param pageable Pagination settings
     * @return A distinct list of recently used Product stores (default 20)
     */
    @Query(value = "SELECT p.store FROM Product p WHERE p.productId IN (SELECT MAX(p.productId) FROM Product p WHERE p.store <> '' AND p.deletedAt IS NULL GROUP BY p.store) ORDER BY p.createdAt DESC")
    Page<String> findDistinctStores(Pageable pageable);

    /**
     * Permanently removes a soft deleted Product from the 'products' database table. A query is needed because deleting
     * through the entity is a soft delete. The Product's Prices have to be removed first.
     * @param productId ID of the Product to remove
     * @return The number of removed Products
     */
    @Modifying
    @Query(value = "DELETE FROM Product p WHERE p.productId = :productId AND p.deletedAt IS NOT NULL")
    int permanentlyDeleteById(@Param("productId") Integer productId);
}
