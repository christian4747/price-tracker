package com.christian4747.pricetracker.models.dtos;

import java.sql.Timestamp;

public class IncomingPriceDTO {

    private double amount;
    private String currency;
    private Timestamp priceStarted;
    private Timestamp priceEnded;
    private Integer productId;

    public IncomingPriceDTO() {
    }

    public IncomingPriceDTO(double amount, String currency, Timestamp priceStarted, Timestamp priceEnded, Integer productId) {
        this.amount = amount;
        this.currency = currency;
        this.priceStarted = priceStarted;
        this.priceEnded = priceEnded;
        this.productId = productId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Timestamp getPriceStarted() {
        return priceStarted;
    }

    public void setPriceStarted(Timestamp priceStarted) {
        this.priceStarted = priceStarted;
    }

    public Timestamp getPriceEnded() {
        return priceEnded;
    }

    public void setPriceEnded(Timestamp priceEnded) {
        this.priceEnded = priceEnded;
    }

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    @Override
    public String toString() {
        return "IncomingPriceDTO{" +
                "amount=" + amount +
                ", currency='" + currency + '\'' +
                ", priceStarted=" + priceStarted +
                ", priceEnded=" + priceEnded +
                ", productId=" + productId +
                '}';
    }
}
