package com.christian4747.pricetracker.models.dtos;

public class IncomingPriceRangeDTO extends IncomingPriceDTO {

    private boolean useEndDateDesc;

    public IncomingPriceRangeDTO() {
    }

    public boolean isUseEndDateDesc() {
        return useEndDateDesc;
    }

    public void setUseEndDateDesc(boolean useEndDateDesc) {
        this.useEndDateDesc = useEndDateDesc;
    }

    @Override
    public String toString() {
        return "IncomingPriceRangeDTO{" +
                "useEndDateDesc=" + useEndDateDesc +
                ", price=" + super.toString() +
                '}';
    }
}
