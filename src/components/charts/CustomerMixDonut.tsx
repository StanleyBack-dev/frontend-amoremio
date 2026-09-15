import MixDonut from "./MixDonut";

export interface CustomerMixRow {
  idCustomer: string | null;
  customerName: string;
  grossSales: number;
}

interface CustomerMixDonutProps {
  data: CustomerMixRow[];
}

export default function CustomerMixDonut({ data }: CustomerMixDonutProps) {
  return (
    <MixDonut
      data={data.map((row) => ({
        key: row.idCustomer ?? row.customerName,
        label: row.customerName,
        value: row.grossSales,
      }))}
      emptyMessage="Nenhum cliente vinculado a vendas no período."
    />
  );
}
