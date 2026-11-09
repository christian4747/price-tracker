package com.christian4747.pricetracker.specification;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class PriceSpecification {

    /**
     * Filters one product's prices. With a start date, a price matches if it started on or after the date, or if it's
     * the newest live price that started before it, since that price was still active when the range began. The other
     * filters apply to both kinds of price.
     * @param productId The product whose prices to filter
     * @param filter The price filter (every bound is inclusive except the end date)
     * @param showDeleted Whether to include soft deleted prices
     * @return The specification for the matching prices
     */
    public static Specification<Price> filterPricesBy(Integer productId, PriceFilterDTO filter, boolean showDeleted) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("product").get("productId"), productId));

            if (!showDeleted) {
                predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            }

            if (filter.startDate() != null) {
                Timestamp startDate = Timestamp.from(filter.startDate());

                // The start of the newest live price that started before the range
                Subquery<Timestamp> activeAtStartSubquery = query.subquery(Timestamp.class);
                Root<Price> earlierPrice = activeAtStartSubquery.from(Price.class);
                activeAtStartSubquery.select(criteriaBuilder.greatest(earlierPrice.<Timestamp>get("priceStarted")))
                        .where(
                                criteriaBuilder.equal(earlierPrice.get("product").get("productId"), productId),
                                criteriaBuilder.isNull(earlierPrice.get("deletedAt")),
                                criteriaBuilder.lessThan(earlierPrice.get("priceStarted"), startDate)
                        );

                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.greaterThanOrEqualTo(root.get("priceStarted"), startDate),
                        criteriaBuilder.and(
                                criteriaBuilder.isNull(root.get("deletedAt")),
                                criteriaBuilder.equal(root.get("priceStarted"), activeAtStartSubquery)
                        )
                ));
            }

            if (filter.endDate() != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("priceStarted"), Timestamp.from(filter.endDate())));
            }

            if (filter.minPrice() != null) {
                predicates.add(NumberBounds.atLeast(criteriaBuilder, root.get("totalAmount"), filter.minPrice()));
            }

            if (filter.maxPrice() != null) {
                predicates.add(NumberBounds.atMost(criteriaBuilder, root.get("totalAmount"), filter.maxPrice()));
            }

            if (filter.minDiscountPercent() != null) {
                predicates.add(NumberBounds.atLeast(criteriaBuilder, root.get("totalPercentage"), filter.minDiscountPercent()));
            }

            if (filter.maxDiscountPercent() != null) {
                predicates.add(NumberBounds.atMost(criteriaBuilder, root.get("totalPercentage"), filter.maxDiscountPercent()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
