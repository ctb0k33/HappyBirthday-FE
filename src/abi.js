export const ABI = [
  {
    inputs: [
      { internalType: "string", name: "encryptedHex", type: "string" },
      { internalType: "string", name: "key", type: "string" },
    ],
    name: "decryptHexMessage",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "message", type: "string" }],
    name: "sendWishes",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "wishes",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];
