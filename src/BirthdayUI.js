import React, { useState } from "react";
import { Gift, Send, Lock, Globe, Wallet, Cake } from "lucide-react";
import * as ethers from "ethers";
import { ABI } from "./abi";
import Swal from "sweetalert2";
import "./App.css";
import axios from "axios";


function encryptMessageJS(message, key) {
  //   // Convert message and key to byte arrays
  const messageBytes = new TextEncoder().encode(message);
  const keyBytes = new TextEncoder().encode(key);

  // Create an array for the encrypted result
  const encrypted = new Uint8Array(messageBytes.length);

  // XOR each byte with the corresponding byte from the key
  for (let i = 0; i < messageBytes.length; i++) {
    encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Convert to hex string for sending to the blockchain
  return Array.from(encrypted)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildingMessage(name, wish, privateKey) {
  // building full message:
  let message = `From ${name}: ${wish}`;
  let finalMessage;
  // Encrypt the message with the private key
  if (privateKey !== "") {
    finalMessage = encryptMessageJS(message, privateKey);
  } else {
    finalMessage = message;
  }
  // Build the final message
  return finalMessage;
}

const BirthdayUI = () => {
  const [name, setName] = useState("PAL");
  const [wish, setWish] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState("0.001");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [secretKey, setSecretKey] = useState("");

  const sendWishes = async () => {
    if (senderName === "" || wish === "") {
      Swal.fire({
        icon: "error",
        text: "Please enter name and wish!",
      });
      return;
    }
    if (!isPublic && secretKey === "") {
      Swal.fire({
        icon: "error",
        text: "Please enter secret key for encryption!",
      });
      return;
    }
    const contractAddress = "0x81e9A5040759193DA699254848D246950D03751C";

    if (isDonating && isWalletConnected) {
      try {
        // Create a provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Create contract instance
        const birthdayContract = new ethers.Contract(
          contractAddress,
          ABI,
          signer
        );

        // Format the message
        const messageToSend = buildingMessage(senderName, wish, secretKey);

        // Show loading state
        Swal.fire({
          title: "Sending your birthday wish...",
          text: "Please confirm the transaction in MetaMask",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Send the transaction
        const tx = await birthdayContract.sendWishes(messageToSend, {
          value: ethers.utils.parseEther(donationAmount),
        });

        // Show success message
        Swal.fire({
          icon: "success",
          title: "Birthday wish sent!",
          text: "Your wish has been recorded on the blockchain.",
          html: `
          <a href="https://bscscan.com/tx/${tx.hash}" 
             target="_blank" 
             class="inline-flex items-center text-purple-500 hover:text-purple-600">
              <span>View on Scan</span>
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
          </a>
          `,
        });

        // Reset form and show confetti
        setWish("");
        setSenderName("");
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
      } catch (error) {
        console.error("Error sending birthday wish:", error);
        Swal.fire({
          icon: "error",
          title: "Transaction failed",
          text: error.message || "Something went wrong with your transaction.",
        });
      }
    } else {
      const messageToSend = buildingMessage(senderName, wish, secretKey);

      // Show loading state
      Swal.fire({
        title: "Sending your birthday wish...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.post(
        "https://happy-birthday-be.vercel.app",
        {
          message: messageToSend,
          isPublic: isPublic,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        Swal.fire({
          icon: "error",
          title: "Transaction failed",
        });
        return;
      }
      const txHash = response.data;

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Birthday wish sent!",
        text: "Your wish has been recorded on the blockchain.",
        html: `
        <a href="https://bscscan.com/tx/${txHash}" 
           target="_blank" 
           class="inline-flex items-center text-purple-500 hover:text-purple-600">
            <span>View on Scan</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        </a>
      `,
      });

      // Reset form and show confetti
      setWish("");
      setSenderName("");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        // BNB Smart Chain Mainnet parameters
        const bnbChainId = "0x38"; // Chain ID for BNB Smart Chain Mainnet (56 in hex)


        // Request wallet to switch to BNB Smart Chain
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: bnbChainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: bnbChainId,
                    chainName: "BNB Smart Chain",
                    nativeCurrency: {
                      name: "BNB",
                      symbol: "BNB",
                      decimals: 18,
                    },
                    rpcUrls: ["https://bsc-dataseed.binance.org/"],
                    blockExplorerUrls: ["https://bscscan.com/"],
                  },
                ],
              });
            } catch (addError) {
              console.error("Failed to add BNB Smart Chain:", addError);
            }
          } else {
            console.error("Failed to switch to BNB Smart Chain:", switchError);
          }
        }

        setIsWalletConnected(true);

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts) => {
          if (accounts.length === 0) {
            // User disconnected their wallet
            setIsWalletConnected(false);
            console.log("Wallet disconnected");
          } else {
            console.log("Account changed to:", accounts[0]);
          }
        });
      } catch (error) {
        // User denied account access
        console.error("User denied account access:", error);
        alert("Please allow MetaMask connection to send gifts!");
      }
    } else {
      // MetaMask not installed
      alert("Please install MetaMask to use this feature!");
      window.open("https://metamask.io/download.html", "_blank");
    }
  };

  //   const sendWish = () => {
  //     if (wish.trim() === "") return;

  //     const newWish = {
  //       id: wishes.length + 1,
  //       message: wish,
  //       isPublic,
  //       author: "You",
  //     };

  //     setWishes([newWish, ...wishes]);
  //     setWish("");
  //     setConfetti(true);

  //     setTimeout(() => {
  //       setConfetti(false);
  //     }, 3000);
  //   };

  // Generate confetti pieces
  const generateConfetti = (count) => {
    const confetti = [];
    const colors = [
      "yellow-500",
      "green-500",
      "red-500",
      "blue-500",
      "purple-500",
      "pink-500",
      "orange-500",
    ];
    const shapes = ["circle", "square", "triangle"];

    for (let i = 0; i < count; i++) {
      const left = Math.floor(Math.random() * 100);
      const delay = Math.random() * 10;
      const size = 4 + Math.floor(Math.random() * 8);
      const color = colors[i % colors.length];
      const shape = shapes[i % shapes.length];
      const duration = 5 + Math.random() * 10;

      confetti.push({ id: i, left, delay, size, color, shape, duration });
    }
    return confetti;
  };

  const confettiPieces = generateConfetti(40);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div class="area">
        <ul class="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>
      {/* CSS Variables for colors */}
      <style jsx>{`
        :root {
          --color-yellow-500: #eab308;
          --color-green-500: #22c55e;
          --color-red-500: #ef4444;
          --color-blue-500: #3b82f6;
          --color-purple-500: #a855f7;
          --color-pink-500: #ec4899;
          --color-orange-500: #f97316;
        }
      `}</style>
      {/* Stars background */}
      <div className="absolute inset-0 z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              backgroundColor: Math.random() > 0.5 ? "#FFD700" : "#FFFFFF",
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          ></div>
        ))}
      </div>
      {/* Falling confetti animation */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute animate-fallDown opacity-90`}
          style={{
            left: `${piece.left}%`,
            top: `-${piece.size}px`,
            width:
              piece.shape === "circle" ? `${piece.size}px` : `${piece.size}px`,
            height:
              piece.shape === "circle" ? `${piece.size}px` : `${piece.size}px`,
            backgroundColor:
              piece.shape === "triangle"
                ? "transparent"
                : `var(--color-${piece.color})`,
            borderRadius:
              piece.shape === "circle"
                ? "50%"
                : piece.shape === "square"
                ? "0"
                : "0",
            borderLeft:
              piece.shape === "triangle"
                ? `${piece.size / 2}px solid transparent`
                : "none",
            borderRight:
              piece.shape === "triangle"
                ? `${piece.size / 2}px solid transparent`
                : "none",
            borderBottom:
              piece.shape === "triangle"
                ? `${piece.size}px solid var(--color-${piece.color})`
                : "none",
            transform: `rotate(${piece.id * 45}deg)`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            animationIterationCount: "infinite",
          }}
        ></div>
      ))}

      {/* Floaty cake slices with slight hover animation */}
      <div
        className="absolute right-10 top-40 w-16 h-16 animate-float opacity-80"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="w-full h-full bg-pink-300 rounded-tr-full rounded-tl-full rounded-br-none rounded-bl-full transform rotate-45 relative overflow-hidden">
          <div className="absolute top-1 left-1 right-1 h-3 bg-white rounded-full opacity-80"></div>
          <div className="absolute top-1/3 left-1/4 w-1 h-6 bg-pink-600 transform rotate-12"></div>
        </div>
      </div>

      <div
        className="absolute left-20 bottom-40 w-16 h-16 animate-float opacity-80"
        style={{ animationDelay: "2s" }}
      >
        <div className="w-full h-full bg-pink-300 rounded-tr-full rounded-tl-full rounded-br-none rounded-bl-full transform rotate-45 relative overflow-hidden">
          <div className="absolute top-1 left-1 right-1 h-3 bg-white rounded-full opacity-80"></div>
          <div className="absolute top-1/3 left-1/4 w-1 h-6 bg-pink-600 transform rotate-12"></div>
        </div>
      </div>

      {/* Add occasional gift box animation */}
      {[...Array(5)].map((_, i) => (
        <div
          key={`gift-${i}`}
          className="absolute animate-fallDown opacity-90"
          style={{
            left: `${10 + i * 20}%`,
            top: `-60px`,
            width: `40px`,
            height: `40px`,
            animationDelay: `${10 + i * 5}s`,
            animationDuration: `15s`,
            animationIterationCount: "infinite",
            zIndex: 5,
          }}
        >
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-red-500 rounded-sm shadow-md"></div>
            <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-yellow-400 transform -translate-x-1/2"></div>
            <div className="absolute left-0 right-0 top-1/2 h-2 bg-yellow-400 transform -translate-y-1/2"></div>
            <div className="absolute top-0 left-0 right-0 h-4 bg-yellow-400 transform -translate-y-1/2 rounded-sm"></div>
          </div>
        </div>
      ))}

      {/* Confetti effect */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                width: `${5 + Math.random() * 7}px`,
                height: `${5 + Math.random() * 7}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 3}s`,
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative mt-5">
          <h1 className="text-5xl font-bold text-pink-600 mb-2 animate-pulse">
            <Cake className="inline-block mr-3 mb-1 text-pink-500" size={40} />
            Happy Birthday {name}!
            <Cake className="inline-block ml-3 mb-1 text-pink-500" size={40} />
          </h1>
          <p className="text-xl text-purple-600">
            Send your wishes and make this day special!
          </p>
        </div>

        {/* Birthday card */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-8 transform hover:scale-102 transition-transform duration-300">
          {/* Sender name input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">
              Who are you
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
              placeholder="Enter your name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>
          {/* Wish input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium">
              Your Birthday Wish
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
              rows="3"
              placeholder="Write your birthday wish here..."
              value={wish}
              onChange={(e) => setWish(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Public/Private toggle */}
            <div className="flex items-center space-x-2">
              <button
                className={`px-4 py-2 rounded-l-lg flex items-center ${
                  isPublic
                    ? "bg-pink-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => {
                  setIsPublic(true);
                  setSecretKey("");
                }}
              >
                <Globe size={16} className="mr-1" /> Public
              </button>
              <button
                className={`px-4 py-2 rounded-r-lg flex items-center ${
                  !isPublic
                    ? "bg-pink-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
                onClick={() => setIsPublic(false)}
              >
                <Lock size={16} className="mr-1" /> Private
              </button>
            </div>

            {/* Donation toggle */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDonating}
                  onChange={() => setIsDonating(!isDonating)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                <span className="ml-3 text-gray-700 flex items-center">
                  <Gift size={16} className="mr-2 text-purple-500" />
                  <span>
                    Love <span className="font-medium text-pink-500">PAL</span>?
                    <span className="ml-1 text-purple-600 font-medium">
                      Send a gift
                    </span>
                  </span>
                </span>
              </label>
            </div>
            {!isPublic && (
              <div className="w-full animate-fadeIn mt-2">
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  <Lock size={14} className="inline mr-1" /> Secret Key
                </label>
                <input
                  type="input"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors"
                  placeholder="Enter secret key for encryption"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1 italic">
              {isPublic
                ? "Public wishes will be visible to everyone onchain."
                : "Private wishes still appear onchain, but they only visible to the birthday person that hold the wish secret key."}
            </div>
          </div>

          {/* Donation input (conditionally rendered) */}
          {isDonating && (
            <div className="mb-4 p-4 bg-pink-50 rounded-lg border border-pink-100 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <label className="text-gray-700 font-medium flex items-center">
                  <Wallet size={18} className="mr-2" /> BNB Amount
                </label>
                {!isWalletConnected && (
                  <button
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                    onClick={connectWallet}
                  >
                    <Wallet size={16} className="mr-2" /> Connect MetaMask
                  </button>
                )}
                {isWalletConnected && (
                  <span className="text-green-600 flex items-center">
                    <Wallet size={16} className="mr-1" /> Wallet Connected
                  </span>
                )}
              </div>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                min="0.01"
                step="0.01"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                disabled={!isWalletConnected}
              />
            </div>
          )}

          {/* Send button */}
          <div className="flex gap-3">
            <button
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              onClick={() =>
                window.open(
                  "https://bscscan.com/address/0x7389efe05997f4999edb48b8cd9ea0c3b8e88590",
                  "_blank"
                )
              }
            >
              <Globe size={18} className="mr-2" /> View wish onchain
            </button>

            <button
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              onClick={sendWishes}
            >
              <Send size={18} className="mr-2" /> Send Birthday Wish
              {isDonating &&
                isWalletConnected &&
                ` + ${donationAmount || 0} BNB Gift`}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes balloonRise {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-25vh) translateX(20px) rotate(5deg);
          }
          50% {
            transform: translateY(-50vh) translateX(-20px) rotate(-5deg);
          }
          75% {
            transform: translateY(-75vh) translateX(10px) rotate(3deg);
          }
          100% {
            transform: translateY(-110vh) translateX(-10px) rotate(-3deg);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(calc(100vh + 20px)) rotate(360deg);
          }
        }

        .animate-balloonRise {
          animation: balloonRise linear forwards;
        }

        .animate-confetti {
          animation: confetti 3s ease-in-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }

        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }

        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default BirthdayUI;
