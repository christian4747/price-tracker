package com.christian4747.pricetracker.services;

import com.christian4747.pricetracker.daos.PriceDAO;
import com.christian4747.pricetracker.models.Price;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


@Service
public class PriceService {

    private final PriceDAO priceDAO;

    @Autowired
    public PriceService(PriceDAO priceDAO) {
        this.priceDAO = priceDAO;
    }

    public Page<Price> getAllPrices(Pageable pageable) {
        return priceDAO.findAll(pageable);
    }
}
