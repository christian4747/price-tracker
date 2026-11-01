package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Product;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.query.QueryUtils;

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
                .distinct(true)
                .where(specification.toPredicate(namesRoot, namesQuery, criteriaBuilder))
                .orderBy(QueryUtils.toOrders(pageable.getSort(), namesRoot, criteriaBuilder));

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
}
