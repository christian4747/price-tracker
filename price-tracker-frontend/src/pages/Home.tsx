import { useContext } from "react"
import Product from "../components/Product"
import Button from "../components/Button";
import { FiPlus } from "react-icons/fi";
import { ModalContext } from "../App";
import AddProductModal from "../components/AddProductModal";
import AddPriceModal from "../components/AddPriceModal";
import EditProductModal from "../components/EditProductModal";
import EditPriceModal from "../components/EditPriceModal";
import DeleteProductModal from "../components/DeleteProductModal";
import DeletePriceModal from "../components/DeletePriceModal";

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
                <Product price={4.99} banner={'1'} />
                <Product price={1.99} banner={'2'} />
                <Product price={0.99} banner={'3'} />
                <Product price={4.99} banner={'4'} />
                <Product price={8.99} banner={'5'} />
                <Product price={9.99} banner={'6'} />
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