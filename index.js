#!/usr/bin/env node

const axios = require("axios");
const { Command } = require("commander");
const program = new Command();
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

program
  .version("1.0.0")
  .description("CLI tool to get cryptocurrency prices")
  .argument("[symbol]", "Cryptocurrency symbol to search for")
  .parse(process.argv);

const cryptoSymbol = program.args[0];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAllCoins() {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/coins/list`);
    //   console.log(response.data)
      return response.data;
    } catch (error) {
      if (
        error.response &&
        error.response.status === 429 &&
        attempt < maxRetries
      ) {
        console.log(
          `Rate limit exceeded, retrying in ${attempt * 2} seconds...`
        );
        await delay(attempt * 2000); // exponential backoff delay
      } else {
        console.error("Error fetching coins list:", error.message);
        return [];
      }
    }
  }
}

async function fetchCryptoPriceById(id) {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
        params: {
          ids: id,
          vs_currencies: "usd",
        },
      });
      return response.data[id].usd;
    } catch (error) {
      if (
        error.response &&
        error.response.status === 429 &&
        attempt < maxRetries
      ) {
        console.log(
          `Rate limit exceeded, retrying in ${attempt * 2} seconds...`
        );
        await delay(attempt * 2000); // exponential backoff delay
      } else {
        console.error("Error fetching cryptocurrency price:", error.message);
        return null;
      }
    }
  }
}

async function displayCryptoPrices() {
  if (cryptoSymbol) {
    const coins = await fetchAllCoins();
    const coin = coins.find(
      (c) => c.symbol.toLowerCase() === cryptoSymbol.toLowerCase()
    );
    if (coin) {
      const price = await fetchCryptoPriceById(coin.id);
      if (price !== null) {
        console.log(
          `${coin.name} (${coin.symbol.toUpperCase()}): ${price} USD`
        );
      } else {
        console.log(
          `Error fetching price for cryptocurrency with symbol '${cryptoSymbol}'.`
        );
      }
    } else {
      console.log(`Cryptocurrency with symbol '${cryptoSymbol}' not found.`);
    }
  } else {
    console.log("Please provide a cryptocurrency symbol.");
  }
}

displayCryptoPrices();
// fetchAllCoins()
