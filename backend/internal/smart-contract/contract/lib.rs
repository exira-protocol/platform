use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use solana_program::pubkey::Pubkey;

declare_id!("CsrCMpn2jbypJKptFtEoYwdUUoQwYfgia6gbCtS58D6H");

// Replace this with the actual USDC mint address
// const USDC_MINT_ADDRESS_STR: &str = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";
const USDC_MINT_PUBKEY: Pubkey = Pubkey::new_from_array([
    83, 120, 114, 81, 114, 99, 97, 89, 54, 119, 98, 56, 84, 51, 89, 80, 66, 121, 89, 51, 77, 77,
    80, 53, 69, 69, 90, 74, 81, 82, 97, 88,
]);

#[program]
mod token_swap {
    use super::*;

    // Initialize the swap contract with admin and token info
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.swap_data.admin = ctx.accounts.admin.key();
        ctx.accounts.swap_data.price = 1_000_000; // Example price (1 USDC = 1 SPL token)
        msg!("Swap contract initialized!");
        Ok(())
    }

    // Updates the price fetched from an oracle (Only admin can call this)
    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.admin.key(),
            ctx.accounts.swap_data.admin,
            SwapError::Unauthorized
        );
        ctx.accounts.swap_data.price = new_price;
        msg!("Price updated to: {}", new_price);
        Ok(())
    }

    // Swap USDC for SPL token
    pub fn swap_usdc_for_spl(ctx: Context<Swap>, amount_usdc: u64) -> Result<()> {
        let price = ctx.accounts.swap_data.price;
        let amount_spl = (amount_usdc * 1_000_000) / price;

        // Safety checks
        require!(amount_spl > 0, SwapError::InvalidAmount);
        require!(
            ctx.accounts.spl_token_vault.amount >= amount_spl,
            SwapError::InsufficientLiquidity
        );

        // Transfer USDC from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.usdc_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount_usdc)?;

        // Fix: Store the mint key in a variable before using it in seeds
        let spl_token_mint_key = ctx.accounts.spl_token_mint.key();
        let seeds = &[
            b"vault".as_ref(),
            spl_token_mint_key.as_ref(),
            &[ctx.bumps.token_vault],
        ];
        let signer = &[&seeds[..]];

        // Transfer SPL tokens from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.spl_token_vault.to_account_info(),
            to: ctx.accounts.user_spl_account.to_account_info(),
            authority: ctx.accounts.token_vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount_spl)?;

        msg!(
            "Swapped {} USDC for {} SPL Tokens!",
            amount_usdc,
            amount_spl
        );
        Ok(())
    }

    // Swap SPL token for USDC
    pub fn swap_spl_for_usdc(ctx: Context<Swap>, amount_spl: u64) -> Result<()> {
        let price = ctx.accounts.swap_data.price;
        let amount_usdc = (amount_spl * price) / 1_000_000;

        // Safety checks
        require!(amount_usdc > 0, SwapError::InvalidAmount);
        require!(
            ctx.accounts.usdc_vault.amount >= amount_usdc,
            SwapError::InsufficientLiquidity
        );

        // Transfer SPL tokens from user to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_spl_account.to_account_info(),
            to: ctx.accounts.spl_token_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount_spl)?;

        // Fix: Store the mint key in a variable before using it in seeds
        let spl_token_mint_key = ctx.accounts.spl_token_mint.key();
        let seeds = &[
            b"vault".as_ref(),
            spl_token_mint_key.as_ref(),
            &[ctx.bumps.token_vault],
        ];
        let signer = &[&seeds[..]];

        // Transfer USDC from vault to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.usdc_vault.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.token_vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount_usdc)?;

        msg!(
            "Swapped {} SPL Tokens for {} USDC!",
            amount_spl,
            amount_usdc
        );
        Ok(())
    }

}

// Define swap data account
#[account]
pub struct SwapData {
    admin: Pubkey,
    price: u64, // Price of SPL token in USDC (multiplied by 1_000_000 for precision)
}

// Initialize swap contract
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        seeds = [b"swap_data"],  // Use a consistent seed for the PDA
        bump,
        space = 8 + 32 + 8
    )]
    pub swap_data: Account<'info, SwapData>, // This is the PDA to store swap info

    #[account(mut)]
    pub admin: Signer<'info>, // The admin wallet initializing the contract

    pub system_program: Program<'info, System>,
}

// Context for updating price
#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut, has_one = admin)]
    pub swap_data: Account<'info, SwapData>,
    pub admin: Signer<'info>,
}

// Context for swapping (Fix: Added `swap_data` here)
#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // Validate USDC mint address using the constant
    #[account(
        constraint = usdc_mint.key() == USDC_MINT_PUBKEY @ SwapError::InvalidUSDCMint,
    )]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"vault", usdc_mint.key().as_ref()],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub spl_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub spl_token_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_spl_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub swap_data: Account<'info, SwapData>,

    #[account(seeds = [b"vault"], bump)]
    pub token_vault: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

// Custom errors
#[error_code]
pub enum SwapError {
    #[msg("Invalid amount.")]
    InvalidAmount,
    #[msg("Insufficient liquidity.")]
    InsufficientLiquidity,
    #[msg("Unauthorized.")]
    Unauthorized,
    #[msg("Invalid USDC Mint Address.")]
    InvalidUSDCMint, // New error for incorrect USDC mint
}
