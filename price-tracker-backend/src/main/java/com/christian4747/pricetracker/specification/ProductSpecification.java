package com.christian4747.pricetracker.specification;

import com.christian4747.pricetracker.models.Price;
import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.PriceFilterDTO;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filterProductBy(ProductFilterDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> stringPredicates = new ArrayList<>();
            // Filter by product brand
            if (filter.brand() != null && !filter.brand().isBlank()) {
                stringPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("brand")),
                        "%" + filter.brand().toLowerCase() + "%"
                ));
            }

            // Filter by product name
            if (filter.name() != null && !filter.name().isBlank()) {
                stringPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        "%" + filter.name().toLowerCase() + "%"
                ));
            }

            // Filter by product store
            if (filter.store() != null && !filter.store().isBlank()) {
                stringPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("store")),
                        "%" + filter.store().toLowerCase() + "%"
                ));
            }

            predicates.add(criteriaBuilder.or(stringPredicates));

            // Filter by product active status
            if (filter.active() != null) {
                predicates.add(criteriaBuilder.equal(root.get("active"), filter.active()));
            }

            // Filter by product updatedAt timestamp (start)
            if (filter.startUpdatedAt() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("updatedAt"), Timestamp.valueOf(filter.startUpdatedAt())));
            }

            // Filter by product updatedAt timestamp (end)
            if (filter.endUpdatedAt() != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("updatedAt"), Timestamp.valueOf(filter.endUpdatedAt())));
            }

            // Filter by product createdAt timestamp (start)
            if (filter.startCreatedAt() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), Timestamp.valueOf(filter.startCreatedAt())));
            }

            // Filter by product createdAt timestamp (end)
            if (filter.endCreatedAt() != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("createdAt"), Timestamp.valueOf(filter.endCreatedAt())));
            }

            // Filter by deleted products
            if (filter.deleted() != null && filter.deleted()) {
                // Filter by product deletedAt timestamp (start)
                if (filter.startDeletedAt() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("deletedAt"), Timestamp.valueOf(filter.startDeletedAt())));
                }
                // Filter by product deletedAt timestamp (end)
                if (filter.endDeletedAt() != null) {
                    predicates.add(criteriaBuilder.lessThan(root.get("deletedAt"), Timestamp.valueOf(filter.endDeletedAt())));
                }
            } else {
                predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> filterProductPriceBy(PriceFilterDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> subqueryPredicates = new ArrayList<>();

            // First find the Price with current timestamp
            Expression<Timestamp> currentTimestamp = criteriaBuilder.currentTimestamp();
            Subquery<Timestamp> priceSubquery = query.subquery(Timestamp.class);
            Root<Price> priceRoot = priceSubquery.from(Price.class);
            priceSubquery.select(criteriaBuilder.greatest(priceRoot.<Timestamp>get("priceStarted")))
                    .where(
                            criteriaBuilder.lessThanOrEqualTo(priceRoot.get("priceStarted"), currentTimestamp),
                            criteriaBuilder.equal(priceRoot.get("product"), root)
                    );

            // MAX Timestamp only gives Timestamp so use another subquery
            Subquery<Integer> currentPriceSubquery = query.subquery(Integer.class);
            Root<Price> currentPriceRoot = currentPriceSubquery.from(Price.class);
            currentPriceSubquery.select(currentPriceRoot.get("priceId"));

            // Filter by minimum price
            if (filter.minPrice() != null) {
                subqueryPredicates.add(criteriaBuilder.greaterThanOrEqualTo(currentPriceRoot.get("totalAmount"), filter.minPrice()));
            }

            // Filter by maximum price
            if (filter.maxPrice() != null) {
                subqueryPredicates.add(criteriaBuilder.lessThan(currentPriceRoot.get("totalAmount"), filter.maxPrice()));
            }

            // Filter by minimum discount (total) percentage
            if (filter.minDiscountPercent() != null) {
                subqueryPredicates.add(criteriaBuilder.greaterThanOrEqualTo(currentPriceRoot.get("totalPercentage"), filter.minDiscountPercent()));
            }

            // Filter by maximum discount (total) percentage
            if (filter.maxDiscountPercent() != null) {
                subqueryPredicates.add(criteriaBuilder.lessThan(currentPriceRoot.get("totalPercentage"), filter.maxDiscountPercent()));
            }

            // Filter by start date
            if (filter.startDate() != null) {
                subqueryPredicates.add(criteriaBuilder.greaterThanOrEqualTo(currentPriceRoot.get("priceStarted"), Timestamp.valueOf(filter.startDate())));
            }

            // Filter by end date
            if (filter.endDate() != null) {
                subqueryPredicates.add(criteriaBuilder.lessThan(currentPriceRoot.get("priceStarted"), Timestamp.valueOf(filter.endDate())));
            }

            // Only use price filter predicates if price filter exists
            if (!subqueryPredicates.isEmpty()) {
                subqueryPredicates.add(criteriaBuilder.equal(currentPriceRoot.get("priceStarted"), priceSubquery));
                predicates.add(criteriaBuilder.exists(currentPriceSubquery.where(criteriaBuilder.and(subqueryPredicates.toArray(new Predicate[0])))));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
