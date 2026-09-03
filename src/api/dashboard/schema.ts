import { z } from "zod";

export const FinanceDashboardSchema = z.object({
  from: z.string(),
  to: z.string(),
  totals: z.object({
    totalPurchases: z.number(),
    totalSales: z.number(),
    totalCommission: z.number(),
    netSales: z.number(),
    costOfGoodsSold: z.number(),
    grossMargin: z.number(),
    grossMarginPercent: z.number(),
    purchaseCount: z.number(),
    salesCount: z.number(),
  }),
  stockValue: z.number(),
  topProducts: z
    .object({
      idProduct: z.string(),
      productName: z.string(),
      quantitySold: z.number(),
      revenue: z.number(),
    })
    .array(),
  productProfitability: z
    .object({
      idProduct: z.string(),
      productName: z.string(),
      quantitySold: z.number(),
      revenue: z.number(),
      cost: z.number(),
      grossProfit: z.number(),
      commission: z.number(),
      netProfit: z.number(),
      marginPercent: z.number(),
    })
    .array()
    .default([]),
  monthlySeries: z
    .object({
      month: z.string(),
      purchases: z.number(),
      sales: z.number(),
    })
    .array(),
  salesByChannel: z
    .object({
      channel: z.string(),
      orderCount: z.number(),
      grossSales: z.number(),
      commission: z.number(),
      netSales: z.number(),
    })
    .array(),
});

export type FinanceDashboard = z.infer<typeof FinanceDashboardSchema>;
