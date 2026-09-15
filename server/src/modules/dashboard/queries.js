export const GET_FINANCE_DASHBOARD_QUERY = `
  query GetFinanceDashboard($input: FinanceDashboardInputDto!) {
    getFinanceDashboard(input: $input) {
      from
      to
      totals {
        totalPurchases
        totalSales
        totalCommission
        netSales
        costOfGoodsSold
        grossMargin
        grossMarginPercent
        purchaseCount
        salesCount
        productionCost
      }
      stockValue
      customersCount
      giveawaysCost
      topProducts {
        idProduct
        productName
        quantitySold
        revenue
      }
      productProfitability {
        idProduct
        productName
        quantitySold
        revenue
        cost
        grossProfit
        commission
        netProfit
        marginPercent
      }
      topProductionInputs {
        idProduct
        productName
        quantityConsumed
        cost
      }
      granularity
      timeSeries {
        date
        purchases
        sales
      }
      salesByChannel {
        channel
        orderCount
        grossSales
        commission
        netSales
      }
      salesByCustomer {
        idCustomer
        customerName
        orderCount
        grossSales
        commission
        netSales
      }
    }
  }
`;
