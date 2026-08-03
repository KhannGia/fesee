const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const LOCAL_CHAIN_IDS = new Set([31337n, 1337n]);

/**
 * Deploys the full StreamCredit stack.
 *
 * On a local network a MockVerifier is used so the protocol can be driven
 * without generating real proofs. On any public network the real Groth16
 * verifier generated from the circuit is mandatory — a mock verifier there
 * would hand out credit limits to anybody.
 */
async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const isLocal = LOCAL_CHAIN_IDS.has(network.chainId);

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${hre.network.name} (chainId ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} ETH\n`);

  // 1. Settlement token
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`MockUSDC        ${usdcAddress}`);

  // 2. Verifier
  let verifierAddress;
  let verifierName;

  if (isLocal) {
    const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
    const verifier = await MockVerifier.deploy();
    await verifier.waitForDeployment();
    verifierAddress = await verifier.getAddress();
    verifierName = "MockVerifier";
    console.log(`MockVerifier    ${verifierAddress}  (local only)`);
  } else {
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();
    verifierAddress = await verifier.getAddress();
    verifierName = "Groth16Verifier";
    console.log(`Groth16Verifier ${verifierAddress}`);
  }

  // 3. Collateral registry
  const CollateralNFT = await hre.ethers.getContractFactory("CollateralNFT");
  const collateralNFT = await CollateralNFT.deploy();
  await collateralNFT.waitForDeployment();
  const collateralAddress = await collateralNFT.getAddress();
  console.log(`CollateralNFT   ${collateralAddress}`);

  // 4. Lending protocol
  const StreamCredit = await hre.ethers.getContractFactory("StreamCredit");
  const streamCredit = await StreamCredit.deploy(verifierAddress, usdcAddress);
  await streamCredit.waitForDeployment();
  const streamCreditAddress = await streamCredit.getAddress();
  console.log(`StreamCredit    ${streamCreditAddress}`);

  // 5. Let the lender lock and release collateral
  await (await collateralNFT.authorizeContract(streamCreditAddress, true)).wait();
  console.log(`\nAuthorized StreamCredit on CollateralNFT`);

  // 6. Seed the pool so local runs have something to lend
  if (isLocal) {
    const liquidity = hre.ethers.parseUnits("100000", 6);
    await (await usdc.approve(streamCreditAddress, liquidity)).wait();
    await (await streamCredit.addLiquidity(liquidity)).wait();
    console.log(`Seeded 100,000 USDC of liquidity`);
  }

  const addresses = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    mockUSDC: usdcAddress,
    verifier: verifierAddress,
    verifierType: verifierName,
    collateralNFT: collateralAddress,
    streamCredit: streamCreditAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(
    __dirname,
    "..",
    `deployed-addresses-${hre.network.name}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses written to ${outPath}`);

  if (!isLocal) {
    console.log(`\nVerify on Etherscan:`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${usdcAddress}`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${verifierAddress}`);
    console.log(`  npx hardhat verify --network ${hre.network.name} ${collateralAddress}`);
    console.log(
      `  npx hardhat verify --network ${hre.network.name} ${streamCreditAddress} ${verifierAddress} ${usdcAddress}`
    );
    console.log(`\nThe pool starts empty — call addLiquidity() before anyone can borrow.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
