import MixDonut from "./MixDonut";

export interface ProductMixRow {
  idProduct: string;
  productName: string;
  revenue: number;
}

interface ProductMixDonutProps {
  data: ProductMixRow[];
}

export default function ProductMixDonut({ data }: ProductMixDonutProps) {
  return (
    <MixDonut
      data={data.map((row) => ({
        key: row.idProduct,
        label: row.productName,
        value: row.revenue,
      }))}
    />
  );
}
