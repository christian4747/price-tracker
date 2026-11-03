package com.christian4747.pricetracker.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

/**
 * A named date range, such as a Black Friday sale. A Period with a store applies to that store, and a Period without
 * one applies to all stores.
 */
@Entity
@Table(name="periods")
@SQLDelete(sql = "UPDATE {h-schema}periods SET deleted_at = COALESCE(deleted_at, NOW()) WHERE period_id=?")
public class Period {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int periodId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PeriodType type;

    private String store;

    @Column(nullable = false)
    private Timestamp periodStarted;

    @Column(nullable = false)
    private Timestamp periodEnded;

    @CreationTimestamp
    private Timestamp createdAt;

    private Timestamp deletedAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    public Period() {
    }

    public Period(int periodId, String name, PeriodType type, String store, Timestamp periodStarted, Timestamp periodEnded, Timestamp createdAt, Timestamp deletedAt, Timestamp updatedAt) {
        this.periodId = periodId;
        this.name = name;
        this.type = type;
        this.store = store;
        this.periodStarted = periodStarted;
        this.periodEnded = periodEnded;
        this.createdAt = createdAt;
        this.deletedAt = deletedAt;
        this.updatedAt = updatedAt;
    }

    public int getPeriodId() {
        return periodId;
    }

    public void setPeriodId(int periodId) {
        this.periodId = periodId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PeriodType getType() {
        return type;
    }

    public void setType(PeriodType type) {
        this.type = type;
    }

    public String getStore() {
        return store;
    }

    public void setStore(String store) {
        this.store = store;
    }

    public Timestamp getPeriodStarted() {
        return periodStarted;
    }

    public void setPeriodStarted(Timestamp periodStarted) {
        this.periodStarted = periodStarted;
    }

    public Timestamp getPeriodEnded() {
        return periodEnded;
    }

    public void setPeriodEnded(Timestamp periodEnded) {
        this.periodEnded = periodEnded;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Timestamp deletedAt) {
        this.deletedAt = deletedAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "Period{" +
                "periodId=" + periodId +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", store='" + store + '\'' +
                ", periodStarted=" + periodStarted +
                ", periodEnded=" + periodEnded +
                ", createdAt=" + createdAt +
                ", deletedAt=" + deletedAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
