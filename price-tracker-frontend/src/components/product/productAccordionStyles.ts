// Styles for the plain and grouped product lists' accordions, shared so the two lists look the same
export const productAccordionStyles = {
    control: { cursor: 'default' },
    chevron: { cursor: 'pointer' },
    // The space under a product's details, the same as the space above its dates line (pt-3 in ProductDetails), so
    // the dates sit centered between the chart and price list above and the divider below
    content: { paddingBottom: 'calc(var(--spacing) * 3)' }
}
