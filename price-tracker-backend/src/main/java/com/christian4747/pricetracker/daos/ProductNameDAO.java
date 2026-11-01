package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface ProductNameDAO {

    /**
     * Gets a page of the distinct names of the Products matching the given specification.
     * @param specification The specification the Products must match
     * @param pageable Pagination and sort settings
     * @return A page of distinct names, with the total number of matching names
     */
    Page<String> findDistinctNames(Specification<Product> specification, Pageable pageable);
}
