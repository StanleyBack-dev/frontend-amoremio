export const GET_UNMAPPED_CHANNEL_PRODUCTS_QUERY = `
  query GetUnmappedChannelProducts($input: GetUnmappedChannelProductsInputDto!) {
    getUnmappedChannelProducts(input: $input) {
      channel
      externalProductId
      externalProductName
      pendingEventCount
    }
  }
`;

export const MAP_CHANNEL_PRODUCT_MUTATION = `
  mutation MapChannelProduct($input: MapChannelProductInputDto!) {
    mapChannelProduct(input: $input) {
      data {
        promotedOrders
        failedOrders
      }
    }
  }
`;
