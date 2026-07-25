import { useEffect, useState } from 'react'
import type { ProductType } from "../../../utils/Types"
import api from '../../../services/api'
import ProductList from '../product/ProductList'
import AddProductModal from '../modals/AddProductModal'
import { useToggleVisibility } from '../../../hooks/useToggleVisibility'
import { useProductDTO } from '../../../hooks/useProductDTO'

const ProductListContainer = () => {
    // State for AddProductModal visibility
    const showAddProduct = useToggleVisibility(false)

    // State for ProductDTO used in adding products
    const productDTO = useProductDTO(
        {
            name: '',
            link: '',
            store: ''
        }
    )

    // List of Products
    const [products, setProducts] = useState<ProductType[]>([])

    // API function for getting all Products
    const getAllProducts = async () => {
        api.getAllProducts()
        .then((res) => {
            setProducts(res.data)
            console.log(res)
        })
        .catch((err) => {
            console.log('Error occurred while getting all products')
            console.log(err)
        })
    }

    // API function for adding a Product
    const addProduct = async () => {
        try {
            const res = api.addProduct(productDTO.value)
                .then(() => {
                    showAddProduct.toggle()
                    getAllProducts()
                })
            console.log(res)
        } catch (err) {
            console.log(`Error occurred while adding ${productDTO.value.name}`)
            console.log(err)
        }
    }

    const toggleAddProduct = () => {
        productDTO.resetProductDTO()
        showAddProduct.toggle()
    }

    useEffect(() => {
        // getAllProducts()
    }, [])

    return (
        <>
            <ProductList
                products={products}
                toggleAddProduct={toggleAddProduct}
                getAllProducts={getAllProducts}
            />
            
            <AddProductModal
                hidden={showAddProduct.value}
                toggleHidden={showAddProduct.toggle}
                addProduct={addProduct}
                setProductDTO={productDTO.setProductDTO}
            />
        </>
    )
}

export default ProductListContainer