export const shadowRaiseConfidentialTokenAbi = [
  {
    type: "function",
    name: "claimDemoCredits",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "hasClaimedDemoCredits",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
