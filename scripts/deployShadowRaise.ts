import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ShadowRaise contracts with ${deployer.address}`);

  const token = await ethers.deployContract("ShadowRaiseConfidentialToken");
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log(`ShadowRaiseConfidentialToken deployed to ${tokenAddress}`);

  const registry = await ethers.deployContract("ShadowRaiseDealRegistry", [
    tokenAddress,
  ]);
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log(`ShadowRaiseDealRegistry deployed to ${registryAddress}`);
  console.log(`NEXT_PUBLIC_SHADOWRAISE_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_SHADOWRAISE_CONTRACT_ADDRESS=${registryAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
