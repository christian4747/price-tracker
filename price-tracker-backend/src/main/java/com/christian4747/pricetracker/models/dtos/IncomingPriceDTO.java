package com.christian4747.pricetracker.models.dtos;

import java.sql.Timestamp;

public class IncomingPriceDTO {

    private double amount;
    private String currency;
    private String description;
    private double discountAmount;
    private double discountPercentage;
    private Timestamp priceStarted;
    private Timestamp priceEnded;
    private Integer productId;
    private double returnAmount;
    private double returnPercentage;

    public IncomingPriceDTO() {
    }

    public IncomingPriceDTO(double amount, String currency, String description, double discountAmount, double discountPercentage, Timestamp priceStarted, Timestamp priceEnded, Integer productId, double returnAmount, double returnPercentage) {
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.discountAmount = discountAmount;
        this.discountPercentage = discountPercentage;
        this.priceStarted = priceStarted;
        this.priceEnded = priceEnded;
        this.productId = productId;
        this.returnAmount = returnAmount;
        this.returnPercentage = returnPercentage;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(double discountAmount) {
        this.discountAmount = discountAmount;
    }

    public double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(double discountPercentage) {
        this.discountPercentage = discountPercentage;
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

    public double getReturnAmount() {
        return returnAmount;
    }

    public void setReturnAmount(double returnAmount) {
        this.returnAmount = returnAmount;
    }

    public double getReturnPercentage() {
        return returnPercentage;
    }

    public void setReturnPercentage(double returnPercentage) {
        this.returnPercentage = returnPercentage;
    }

    @Override
    public String toString() {
        return "IncomingPriceDTO{" +
                "amount=" + amount +
                ", currency='" + currency + '\'' +
                ", description='" + description + '\'' +
                ", discountAmount=" + discountAmount +
                ", discountPercentage=" + discountPercentage +
                ", priceStarted=" + priceStarted +
                ", priceEnded=" + priceEnded +
                ", productId=" + productId +
                ", returnAmount=" + returnAmount +
                ", returnPercentage=" + returnPercentage +
                '}';
    }
}
