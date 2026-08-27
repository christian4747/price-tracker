package com.christian4747.pricetracker.models.dtos;

import java.util.List;

public record ResponseAndCount<T>(List<T> content, Long count) {}
