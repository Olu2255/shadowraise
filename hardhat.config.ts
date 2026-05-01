import "dotenv/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "l1",
      chainId: 421614,
      url: configVariable("ARBITRUM_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
