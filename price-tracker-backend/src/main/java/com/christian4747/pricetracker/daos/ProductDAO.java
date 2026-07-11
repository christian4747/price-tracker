package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductDAO extends JpaRepository<Product, Integer> {
}
