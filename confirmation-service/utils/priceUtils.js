import axios from 'axios'

async function getPriceData (isin) {
  try {
    const response = await axios.get(
      `https://onlineweiterbildung-reutlingen-university.de/vswsp5/index.php?isin=${isin}`
    )

    const priceData = response.data

    if (
      typeof priceData === 'object' &&
      priceData !== null &&
      Object.keys(priceData).length > 0
    ) {
      const price = parseFloat(Object.values(priceData)[0])

      if (isNaN(price)) {
        throw new Error('Price data is not a valid number.')
      }

      return price
    } else {
      throw new Error('Invalid price data structure.')
    }
  } catch (error) {
    console.error('Price data could not be retrieved:', error.message)
    throw new Error('Error retrieving price data.')
  }
}

export { getPriceData }
