import { useEffect, useState } from 'react'
import type { ProductDTO, ProductType } from "../../utils/Types"
import api from '../../services/api'
import ProductList from './ProductList'
import AddProductModal from './AddProductModal'

const ProductListContainer = () => {
    // State for showing AddProductModal
    const [showAddProduct, setShowAddProduct] = useState<boolean>(false)

    // State for ProductDTO used in adding products
    const [productDTO, setProductDTO] = useState<ProductDTO>({name: '', link: '', store: ''})

    // Toggle visibility of AddProductModal
    const toggleAddProduct = () => {
        setShowAddProduct(prev => !prev)
    }

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
            const res = api.addProduct(productDTO)
                .then(() => {
                    toggleAddProduct()
                    getAllProducts()
                })

            console.log(res)
        } catch (err) {
            console.log(`Error occurred while adding ${productDTO.name}`)
            console.log(err)
        }
    }

    useEffect(() => {
        getAllProducts()
    }, [])

    return (
        <>
            <ProductList
                products={products}
                toggleAddProduct={toggleAddProduct}
            />
            
            <AddProductModal
                hidden={showAddProduct}
                toggleHidden={toggleAddProduct}
                addProduct={addProduct}
                setProductDTO={setProductDTO}
            />
        </>
    )
}

export default ProductListContainer