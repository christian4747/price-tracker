import { createContext, useState } from 'react';
import './App.css'
import Home from './pages/Home';

interface Product {
    productId: number,
    name: string,
    link: string,
    store: string,
    createdAt: string,
    updatedAt: string,
    prices: Price[]
}

interface ProductContext {
    selectedProduct: Product, 
    setSelectedProduct: React.Dispatch<React.SetStateAction<Product>>
}

interface Price {
    priceId: number,
    amount: string,
    currency: string,
    priceStarted: string,
    priceEnded: string,
    createdAt: string,
    updatedAt: string,
    productId: number
}

interface PriceContext {
    selectedPrice: Price, 
    setSelectedPrice: React.Dispatch<React.SetStateAction<Price>>
}

interface ModalSettings {
    addProductHidden: boolean,
    addPriceHidden: boolean,
    editProductHidden: boolean,
    editPriceHidden: boolean,
    deletePriceHidden: boolean,
    deleteProductHidden: boolean
}

interface ModalContext {
    modalSettings: ModalSettings,
    setModalSettings: React.Dispatch<React.SetStateAction<ModalSettings>>
}

const ProductContext = createContext<ProductContext | null>(null);
const PriceContext = createContext<PriceContext | null>(null);
const ModalContext = createContext<ModalContext | null>(null);

function App() {

    const [selectedProduct, setSelectedProduct] = useState<Product>(
        {
            productId: 0,
            name: '',
            link: '',
            store: '',
            createdAt: '',
            updatedAt: '',
            prices: []
        }
    )

    const [selectedPrice, setSelectedPrice] = useState<Price>(
        {
            priceId: 0,
            amount: '',
            currency: '',
            priceStarted: '',
            priceEnded: '',
            createdAt: '',
            updatedAt: '',
            productId: 0
        }
    )

    const [modalSettings, setModalSettings] = useState<ModalSettings>(
        {
            addProductHidden: true,
            addPriceHidden: true,
            editProductHidden: true,
            editPriceHidden: true,
            deletePriceHidden: true,
            deleteProductHidden: true
        }
    )
    return (
        <>
            <ProductContext value={{selectedProduct, setSelectedProduct}}>
                <PriceContext value={{selectedPrice, setSelectedPrice}}>
                    <ModalContext value={{modalSettings, setModalSettings}}>
                        <Home/>
                    </ModalContext>
                </PriceContext>
            </ProductContext>
        </>
    )
}

export default App
export {ProductContext, PriceContext, ModalContext}
export type {Product, Price, ModalSettings}
