import { Center, Pagination } from '@mantine/core'

export interface ProductListFooter {
    total: number
    value?: number | undefined
    onChange?: ((value: number) => void) | undefined
}

export const ProductListFooter = ({total, value, onChange}: ProductListFooter) => {
    return (
        <footer className="fixed bottom-5 left-0 z-50 w-full">
            <Center>
                <Pagination
                    total={total / 10}
                    value={value}
                    onChange={onChange}
                />
            </Center>
        </footer>
    )
}