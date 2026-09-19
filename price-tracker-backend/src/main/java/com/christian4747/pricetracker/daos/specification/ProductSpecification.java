package com.christian4747.pricetracker.daos.specification;

import com.christian4747.pricetracker.models.Product;
import com.christian4747.pricetracker.models.dtos.ProductFilterDTO;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filterBy(ProductFilterDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by product brand
            if (filter.brand() != null && !filter.brand().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("brand")),
                        "%" + filter.brand().toLowerCase() + "%"
                ));
            }

            // Filter by product name
            if (filter.name() != null && !filter.name().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        "%" + filter.name().toLowerCase() + "%"
                ));
            }

            // Filter by product store
            if (filter.store() != null && !filter.store().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("store")),
                        "%" + filter.store().toLowerCase() + "%"
                ));
            }

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
            if (filter.deleted() != null && Boolean.parseBoolean(filter.deleted())) {
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

}
