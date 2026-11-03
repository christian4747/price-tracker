package com.christian4747.pricetracker.models.dtos;

import com.christian4747.pricetracker.models.PeriodType;

import java.sql.Timestamp;

public class IncomingPeriodDTO {

    private String name;
    private PeriodType type;
    private String store;
    private Timestamp periodStarted;
    private Timestamp periodEnded;

    public IncomingPeriodDTO() {
    }

    public IncomingPeriodDTO(String name, PeriodType type, String store, Timestamp periodStarted, Timestamp periodEnded) {
        this.name = name;
        this.type = type;
        this.store = store;
        this.periodStarted = periodStarted;
        this.periodEnded = periodEnded;
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

    @Override
    public String toString() {
        return "IncomingPeriodDTO{" +
                "name='" + name + '\'' +
                ", type=" + type +
                ", store='" + store + '\'' +
                ", periodStarted=" + periodStarted +
                ", periodEnded=" + periodEnded +
                '}';
    }
}
