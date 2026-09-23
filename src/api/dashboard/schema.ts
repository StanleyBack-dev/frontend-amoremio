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
    productionCost: z.number().default(0),
  }),
  stockValue: z.number(),
  customersCount: z.number().default(0),
  giveawaysCost: z.number().default(0),
  topProducts: z
    .object({
      idProduct: z.string(),
      productName: z.string(),
      productCoverThumbnailUrl: z.string().nullable().optional(),
      quantitySold: z.number(),
      revenue: z.number(),
    })
    .array(),
  productProfitability: z
    .object({
      idProduct: z.string(),
      productName: z.string(),
      productCoverThumbnailUrl: z.string().nullable().optional(),
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
  topProductionInputs: z
    .object({
      idProduct: z.string(),
      productName: z.string(),
      productCoverThumbnailUrl: z.string().nullable().optional(),
      quantityConsumed: z.number(),
      cost: z.number(),
    })
    .array()
    .default([]),
  granularity: z.enum(["DAY", "WEEK", "MONTH"]),
  timeSeries: z
    .object({
      date: z.string(),
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
  salesByCustomer: z
    .object({
      idCustomer: z.string().nullable(),
      customerName: z.string(),
      orderCount: z.number(),
      grossSales: z.number(),
      commission: z.number(),
      netSales: z.number(),
    })
    .array()
    .default([]),
});

export type FinanceDashboard = z.infer<typeof FinanceDashboardSchema>;
