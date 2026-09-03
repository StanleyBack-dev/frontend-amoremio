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
      }
      stockValue
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
      monthlySeries {
        month
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
    }
  }
`;
