import { useContext } from "react"
import Button from "../components/Button";
import { FiPlus } from "react-icons/fi";
import { ModalContext } from "../App";
import AddProductModal from "../components/AddProductModal";
import AddPriceModal from "../components/AddPriceModal";
import EditProductModal from "../components/EditProductModal";
import EditPriceModal from "../components/EditPriceModal";
import DeleteProductModal from "../components/DeleteProductModal";
import DeletePriceModal from "../components/DeletePriceModal";
import Product from "../components/Product";

function Home() {
    const {modalSettings, setModalSettings} = useContext(ModalContext) as ModalContext

    return (
        <>
            <div className="flex items-baseline gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-5xl font-bold mb-3 font-mono">
                        Products (6)
                    </div>
                    <Button
                        onClick={() => {setModalSettings(prev => ({...prev, addProductHidden: !prev.addProductHidden}))}}
                    >
                        <FiPlus size={24} />
                    </Button>
                </div>
                {/* <div className="pr-2">
                    <FaFilter size={24} />
                </div> */}
            </div>

            <div className="flex flex-col gap-2 mb-5">
                <Product productName={"Product 1"} price={4.99} discountPercent={50} bannerType={'one-year'} />
                <Product productName={"Product 2"} price={1.99} discountPercent={80} bannerType={'two-year'} />
                <Product productName={"Product 3"} price={0.99} discountPercent={90} bannerType={'all-time'} />
                <Product productName={"Product 4"} price={4.99} discountPercent={50} />
                <Product productName={"Product 5"} price={8.99} discountPercent={10} />
                <Product productName={"Product 6"} price={9.99} discountPercent={0} />
            </div>
            
            <AddProductModal hidden={modalSettings.addProductHidden} setModalSettings={setModalSettings}/>
            <AddPriceModal hidden={modalSettings.addPriceHidden} setModalSettings={setModalSettings}/>
            <EditProductModal hidden={modalSettings.editProductHidden} setModalSettings={setModalSettings} />
            <EditPriceModal hidden={modalSettings.editPriceHidden} setModalSettings={setModalSettings} />
            <DeleteProductModal hidden={modalSettings.deleteProductHidden} setModalSettings={setModalSettings} />
            <DeletePriceModal hidden={modalSettings.deletePriceHidden} setModalSettings={setModalSettings} />
        </>
    )
}

export default Home