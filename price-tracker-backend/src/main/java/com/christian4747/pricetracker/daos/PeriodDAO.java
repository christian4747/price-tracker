package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Period;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeriodDAO extends JpaRepository<Period, Integer> {

    /**
     * Finds all Periods with the given name, ignoring case, whether or not they are soft deleted.
     * @param name Name of the Periods to find
     * @return A list of all the Periods with the given name
     */
    List<Period> findAllByNameIgnoreCase(String name);
}
