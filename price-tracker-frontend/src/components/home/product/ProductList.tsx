import { Accordion } from "@mantine/core"
import type { ProductType } from "../../../utils/Types"
import ProductContainer from '../containers/ProductPriceListContainer'

type ProductListProps = {
    products: ProductType[]
}

const ProductList = ({products}: ProductListProps) => {
    return (
        <>
            <div className="flex pb-5 flex-col border-smoke">
                <Accordion
                    multiple
                    variant="unstyled"
                    styles={{
                        control: { cursor: 'default' },
                        chevron: { cursor: 'pointer' },
                    }}
                    chevronIconSize={24}
                >
                    {products?.map((product) => {
                        return (
                            <Accordion.Item value={product.name + product.store} key={product.name + product.store}>
                                <ProductContainer
                                    product={product}
                                />
                            </Accordion.Item>
                        )
                    })}
                </Accordion>
            </div>
        </>
    )
}

export default ProductList