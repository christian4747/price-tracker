package com.christian4747.pricetracker.daos;

import com.christian4747.pricetracker.models.Period;
import com.christian4747.pricetracker.models.PeriodType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@DatabaseTest
class PeriodDAOTest {

    private static final Timestamp START = Timestamp.valueOf("2026-11-27 00:00:00");
    private static final Timestamp END = Timestamp.valueOf("2026-11-30 23:59:00");
    private static final Timestamp DELETED = Timestamp.valueOf("2026-12-01 00:00:00");

    @Autowired
    private PeriodDAO periodDAO;

    @Autowired
    private EntityManager entityManager;

    private Period addPeriod(String name, Timestamp deletedAt) {
        Period period = new Period(0, name, PeriodType.SALE, null, START, END, null, deletedAt, null);
        entityManager.persist(period);
        return period;
    }

    private void saveFixtures() {
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findAllByNameIgnoreCaseMatchesADifferentCase() {
        addPeriod("Black Friday", null);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("black FRIDAY"))
                .extracting(Period::getName)
                .containsExactly("Black Friday");
    }

    @Test
    void findAllByNameIgnoreCaseIncludesDeletedPeriods() {
        addPeriod("Black Friday", DELETED);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("Black Friday"))
                .extracting(Period::getName)
                .containsExactly("Black Friday");
    }

    @Test
    void findAllByNameIgnoreCaseLeavesOutNamesThatOnlyContainIt() {
        addPeriod("Black Friday weekend", null);
        saveFixtures();

        assertThat(periodDAO.findAllByNameIgnoreCase("Black Friday")).isEmpty();
    }

    @Test
    void deleteByIdKeepsThePeriodWithADeletedTime() {
        Period period = addPeriod("Black Friday", null);
        saveFixtures();

        periodDAO.deleteById(period.getPeriodId());
        saveFixtures();

        assertThat(entityManager.find(Period.class, period.getPeriodId()).getDeletedAt()).isNotNull();
    }

    @Test
    void deleteByIdKeepsTheFirstDeletedTime() {
        Period period = addPeriod("Black Friday", DELETED);
        saveFixtures();

        periodDAO.deleteById(period.getPeriodId());
        saveFixtures();

        assertThat(entityManager.find(Period.class, period.getPeriodId()).getDeletedAt()).isEqualTo(DELETED);
    }

    @Test
    void permanentlyDeleteByIdRemovesASoftDeletedPeriod() {
        Period period = addPeriod("Black Friday", DELETED);
        saveFixtures();

        int removed = periodDAO.permanentlyDeleteById(period.getPeriodId());
        entityManager.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(entityManager.find(Period.class, period.getPeriodId())).isNull();
    }

    @Test
    void permanentlyDeleteByIdLeavesAPeriodThatIsNotDeleted() {
        Period period = addPeriod("Black Friday", null);
        saveFixtures();

        int removed = periodDAO.permanentlyDeleteById(period.getPeriodId());
        entityManager.clear();

        assertThat(removed).isZero();
        assertThat(entityManager.find(Period.class, period.getPeriodId())).isNotNull();
    }
}
