package com.christian4747.pricetracker.models.dtos;

import java.sql.Timestamp;

public class IncomingPriceDTO {

    private double amount;
    private String currency;
    private String description;
    private Timestamp priceStarted;
    private Timestamp priceEnded;
    private Integer productId;
    private double returnAmount;

    public IncomingPriceDTO() {
    }

    public IncomingPriceDTO(double amount, String currency, String description, Timestamp priceStarted, Timestamp priceEnded, Integer productId, double returnAmount) {
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.priceStarted = priceStarted;
        this.priceEnded = priceEnded;
        this.productId = productId;
        this.returnAmount = returnAmount;
    }

    public double getAmount() {
        return amount;
    }

    public double getReturnAmount() {
        return returnAmount;
    }

    public void setReturnAmount(double returnAmount) {
        this.returnAmount = returnAmount;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
                ", description='" + description + '\'' +
                ", priceStarted=" + priceStarted +
                ", priceEnded=" + priceEnded +
                ", productId=" + productId +
                ", returnAmount=" + returnAmount +
                '}';
    }
}
