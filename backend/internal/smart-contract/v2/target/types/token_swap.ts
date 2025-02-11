export type TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapUsdcForSpl",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdcAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userSplAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountUsdc",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapSplForUsdc",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdcAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userSplAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountSpl",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swapData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount."
    },
    {
      "code": 6001,
      "name": "InsufficientLiquidity",
      "msg": "Insufficient liquidity."
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6003,
      "name": "InvalidUSDCMint",
      "msg": "Invalid USDC Mint Address."
    }
  ]
};

export const IDL: TokenSwap = {
  "version": "0.1.0",
  "name": "token_swap",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updatePrice",
      "accounts": [
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "newPrice",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapUsdcForSpl",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdcAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userSplAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountUsdc",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swapSplForUsdc",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "usdcMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdcVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdcAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "splTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userSplAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "swapData",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountSpl",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swapData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount."
    },
    {
      "code": 6001,
      "name": "InsufficientLiquidity",
      "msg": "Insufficient liquidity."
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6003,
      "name": "InvalidUSDCMint",
      "msg": "Invalid USDC Mint Address."
    }
  ]
};
