package com.christian4747.pricetracker.models.dtos;

import com.christian4747.pricetracker.models.Product;

import java.util.List;

public record ProductNameGroupDTO(String name, List<Product> products) {}
