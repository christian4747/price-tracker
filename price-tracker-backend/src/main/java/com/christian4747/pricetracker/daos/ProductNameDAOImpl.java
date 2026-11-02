package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProductNameDAOImpl implements ProductNameDAO {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<String> findDistinctNames(Specification<Product> specification, Pageable pageable) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();

        CriteriaQuery<String> namesQuery = criteriaBuilder.createQuery(String.class);
        Root<Product> namesRoot = namesQuery.from(Product.class);
        namesQuery.select(namesRoot.get("name"))
                .where(specification.toPredicate(namesRoot, namesQuery, criteriaBuilder))
                .groupBy(namesRoot.get("name"))
                .orderBy(pageable.getSort().stream().map(order -> toNameOrder(order, namesRoot, criteriaBuilder)).toList());

        List<String> names = entityManager.createQuery(namesQuery)
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        CriteriaQuery<Long> countQuery = criteriaBuilder.createQuery(Long.class);
        Root<Product> countRoot = countQuery.from(Product.class);
        countQuery.select(criteriaBuilder.countDistinct(countRoot.get("name")))
                .where(specification.toPredicate(countRoot, countQuery, criteriaBuilder));

        return new PageImpl<>(names, pageable, entityManager.createQuery(countQuery).getSingleResult());
    }

    /**
     * Positions a name by its first product in the given order: the lowest value when ascending, the highest when descending.
     * @param order The order to convert
     * @param root The root of the names query
     * @param criteriaBuilder The criteria builder of the names query
     * @return The order to use in the names query, which is grouped by name
     */
    private Order toNameOrder(Sort.Order order, Root<Product> root, CriteriaBuilder criteriaBuilder) {
        // PostgreSQL has no MIN or MAX for booleans, so compare them as numbers.
        // Hibernate reports a primitive boolean field as Boolean, so this also covers Product.active
        if (root.get(order.getProperty()).getJavaType() == Boolean.class) {
            Expression<Integer> booleanAsNumber = criteriaBuilder.<Integer>selectCase()
                    .when(criteriaBuilder.isTrue(root.get(order.getProperty())), 1)
                    .otherwise(0);
            return toNameOrder(order, booleanAsNumber, criteriaBuilder);
        }

        // The type only satisfies the criteria API and isn't checked at runtime, since the other sort fields are text, numbers, or timestamps
        Expression<String> field = root.get(order.getProperty());
        return toNameOrder(order, field, criteriaBuilder);
    }

    private <T extends Comparable<? super T>> Order toNameOrder(Sort.Order order, Expression<T> field, CriteriaBuilder criteriaBuilder) {
        return order.isAscending() ? criteriaBuilder.asc(criteriaBuilder.least(field)) : criteriaBuilder.desc(criteriaBuilder.greatest(field));
    }
}
