package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Price;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PriceDAO extends JpaRepository<Price, Integer> {
}
