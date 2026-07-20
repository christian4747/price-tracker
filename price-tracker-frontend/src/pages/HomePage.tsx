import { useEffect, useState } from "react"
import Button from "../components/common/Button";
import { FiPlus } from "react-icons/fi";
import AddProductModal from "../components/product/AddProductModal";
import ProductList from "../components/product/ProductList";
import type { ProductType } from "../App";
import axios from "axios";
import api from "../services/api";

function Home() {
    const [showAddProduct, setShowAddProduct] = useState<boolean>(false)

    const toggleAddProduct = () => {
        setShowAddProduct(prev => !prev)
    }

    const [products, setProducts] = useState<ProductType[]>([])

    const getAllProducts = async () => {
        await axios.get(api.getRootUrl() + "/products")
        .then((res) => {
            setProducts(res.data)
            console.log(res)
        })
        .catch((err) => {
            console.log('Error occurred while getting all products')
            console.log(err)
        })
    }

    useEffect(() => {
        getAllProducts()
    }, [])

    return (
        <>
            <div className="flex items-baseline gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-5xl font-bold mb-3 font-mono">
                        Products
                    </div>
                    <Button
                        onClick={toggleAddProduct}
                    >
                        <FiPlus size={24} />
                    </Button>
                </div>
                {/* <div className="pr-2">
                    <FaFilter size={24} />
                </div> */}
            </div>

            <ProductList products={products} />
            
            <AddProductModal
                hidden={showAddProduct}
                toggleHidden={toggleAddProduct}
                getAllProducts={getAllProducts}
            />            
        </>
    )
}

export default Home