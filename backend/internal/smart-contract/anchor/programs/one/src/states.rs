use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::Metadata,
    token::{Mint, Token, TokenAccount},
};

use crate::constants::MIN_SEED;

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}

#[derive(Accounts)]
#[instruction(
    params: InitTokenParams
)]
pub struct InitToken<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    // create mint account PDA
    #[account(
        init,
        seeds = [MIN_SEED],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        // mint::authority = mint,
        mint::authority = payer.key(),
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [MIN_SEED],
        bump,
        mint::authority = payer.key(),
    )]
    pub mint: Account<'info, Mint>,

    // create destination ATA if it doesn't exist
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    #[account(mut)]
    pub from: Signer<'info>,

    pub to: SystemAccount<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,

    // create recipient ATA if it doesn't exist and the fee payer is "from"
    #[account(
        init_if_needed,
        payer = from,
        associated_token::mint = mint,
        associated_token::authority = to,
    )]
    pub to_ata: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub from_token_a_ata: Account<'info, TokenAccount>, // User's Token A account

    #[account(mut)]
    pub vault_token_a_ata: Account<'info, TokenAccount>, // Contract's Token A vault

    #[account(mut)]
    pub vault_token_b_ata: Account<'info, TokenAccount>, // Contract's Token B vault

    #[account(mut)]
    pub to_token_b_ata: Account<'info, TokenAccount>, // User's Token B account

    #[account(seeds = [b"vault"], bump)]
    pub vault_authority: SystemAccount<'info>, // Contract's PDA authority

    #[account()]
    pub price_account: Account<'info, PriceAccount>, // Added: Account holding the price

    pub token_program: Program<'info, Token>, // SPL Token Program
}

#[account]
pub struct PriceAccount {
    pub price: u64, // The price value (using u64 for simplicity)
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    // The authority (signer) attempting to withdraw funds - must match the hardcoded admin
    #[account(mut)]
    pub authority: Signer<'info>, // This will be checked against the hardcoded ADMIN_ADDRESS

    // Contract's Token A vault (from where Token A is withdrawn)
    #[account(mut)]
    pub vault_token_a_ata: Account<'info, TokenAccount>,

    // Contract's Token B vault (from where Token B is withdrawn)
    #[account(mut)]
    pub vault_token_b_ata: Account<'info, TokenAccount>,

    // Admin's Token A account (where Token A will be deposited)
    #[account(mut)]
    pub authority_token_a_ata: Account<'info, TokenAccount>,

    // Admin's Token B account (where Token B will be deposited)
    #[account(mut)]
    pub authority_token_b_ata: Account<'info, TokenAccount>,

    // PDA that authorizes contract to perform transfers
    #[account(seeds = [b"vault"], bump)]
    pub vault_authority: SystemAccount<'info>,

    // Token Program (SPL Token)
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializePrice<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8,
        seeds = [b"price"],  // Use a static seed for deterministic PDA
        bump
    )]
    pub price_account: Account<'info, PriceAccount>, // PDA for price_account

    #[account(mut)]
    pub user: Signer<'info>, // User signs to pay for the account creation

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    pub price_account: Account<'info, PriceAccount>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub price_account: Account<'info, PriceAccount>,
    pub user: Signer<'info>, // Simplified: any signer can update the price
}

#[derive(Accounts)]
pub struct ApproveToken<'info> {
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,

    pub from: Signer<'info>,

    /// CHECK: This is an unchecked account because the delegate doesn't need to be of any specific type.
    pub delegate: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,

    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ChangeMintAuthority<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub current_authority: Signer<'info>, // Current mint authority must sign the transaction
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(
    params: InitTokenParams
)]
pub struct UpdateMetadata<'info> {
    /// CHECK: New Metaplex Account being created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
}
