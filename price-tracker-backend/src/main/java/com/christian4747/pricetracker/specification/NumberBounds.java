package com.christian4747.pricetracker.specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

/**
 * Builds the minimum and maximum comparisons for prices' amounts and percentages. Both bounds are inclusive, since a
 * user who types a maximum price of 20 expects a price of 20 to match.
 * <p>
 * Amounts and percentages are stored as doubles, which can't hold most decimals exactly, so a value the app computed
 * can land just past the bound a user typed: 1 - 0.7 is stored as 0.30000000000000004. Each bound is widened by
 * TOLERANCE, which is far smaller than any real difference between two prices. Once these columns are BigDecimal
 * (numeric in the database), the tolerance can go and these become plain comparisons.
 */
public final class NumberBounds {

    static final double TOLERANCE = 1e-9;

    private NumberBounds() {
    }

    /**
     * @return A predicate that's true when the value is at least the minimum
     */
    public static Predicate atLeast(CriteriaBuilder criteriaBuilder, Expression<Double> value, double minimum) {
        return criteriaBuilder.greaterThanOrEqualTo(value, minimum - TOLERANCE);
    }

    /**
     * @return A predicate that's true when the value is at most the maximum
     */
    public static Predicate atMost(CriteriaBuilder criteriaBuilder, Expression<Double> value, double maximum) {
        return criteriaBuilder.lessThanOrEqualTo(value, maximum + TOLERANCE);
    }
}
