use anchor_lang::prelude::*;

use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
        update_metadata_accounts_v2, CreateMetadataAccountsV3, UpdateMetadataAccountsV2,
    },
    token::{Approve, Burn, MintTo, SetAuthority, Transfer},
};
mod constants;
mod errors;
mod states;

use crate::errors::*;
use crate::states::*;

use constants::*;

declare_id!("CsrCMpn2jbypJKptFtEoYwdUUoQwYfgia6gbCtS58D6H");

#[account]
pub struct PriceAccount {
    pub price: u64, // The price value (using u64 for simplicity)
}

#[program]
pub mod spl {

    use super::*;

    pub fn initialize(ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
        // PDA seeds and bump to "sign" for CPI
        let seeds = &[MIN_SEED, &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        // On-chain token metadata for the mint
        let token_data = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.payer.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                // mint_authority: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            &signer,
        );

        create_metadata_accounts_v3(
            metadata_ctx, // cpi context
            token_data,   // token metadata
            true,         // is_mutable
            true,         // update_authority_is_signer
            None,         // collection details
        )?;

        Ok(())
    }

    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        new_metadata: InitTokenParams,
    ) -> Result<()> {
        let new_data = DataV2 {
            name: new_metadata.name,
            symbol: new_metadata.symbol,
            uri: new_metadata.uri,
            seller_fee_basis_points: 0, // Modify if needed
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            UpdateMetadataAccountsV2 {
                update_authority: ctx.accounts.payer.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
            },
        );

        update_metadata_accounts_v2(
            metadata_ctx,   // CPI context
            None,           // New update authority, if any
            Some(new_data), // Updated data
            None,           // Primary sale happened
            None,           // Is mutable
        )?;

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.mint.supply + amount <= MAX_CAP,
            CustomError::CapExceed
        );

        // PDA seeds and bump to "sign" for CPI
        let seeds = &[MIN_SEED, &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    // authority: ctx.accounts.mint.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn transfer(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    authority: ctx.accounts.from.to_account_info(),
                    from: ctx.accounts.from_ata.to_account_info(),
                    to: ctx.accounts.to_ata.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn swap_tokens(ctx: Context<SwapTokens>, amount_token_a: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.from_token_a_ata.mint,
            TOKEN_A_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
            CustomError::InvalidTokenAMint
        );

        require_keys_eq!(
            ctx.accounts.to_token_b_ata.mint,
            TOKEN_B_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
            CustomError::InvalidTokenBMint
        );

        let price_account = &ctx.accounts.price_account;
        let price = price_account.price;

        // Ensure price is valid
        require!(price > 0, CustomError::InvalidPrice);

        // Since both tokens have 6 decimals, we can use a fixed scaling factor
        let scaling_factor = 1_000_000; // 10^6 for 6 decimals

        // Calculate Token B amount with fixed-point precision
        let amount_token_b = amount_token_a
            .checked_mul(scaling_factor)
            .ok_or(CustomError::CalculationError)?
            .checked_div(price)
            .ok_or(CustomError::CalculationError)?;

        // Ensure contract has enough Token B in the vault
        require!(
            ctx.accounts.vault_token_b_ata.amount >= amount_token_b,
            CustomError::InsufficientTokenBBalance
        );

        // Step 1: Transfer Token A from user to contract vault
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    authority: ctx.accounts.user.to_account_info(),
                    from: ctx.accounts.from_token_a_ata.to_account_info(),
                    to: ctx.accounts.vault_token_a_ata.to_account_info(),
                },
            ),
            amount_token_a,
        )?;

        // Step 2: Transfer calculated Token B from contract vault to user
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    authority: ctx.accounts.vault_authority.to_account_info(),
                    from: ctx.accounts.vault_token_b_ata.to_account_info(),
                    to: ctx.accounts.to_token_b_ata.to_account_info(),
                },
                &[&[b"vault", &[ctx.bumps.vault_authority]]], // PDA signer
            ),
            amount_token_b,
        )?;

        Ok(())
    }

    pub fn withdraw_funds(
        ctx: Context<WithdrawFunds>,
        amount_token_a: u64,
        amount_token_b: u64,
    ) -> Result<()> {
        // Admin Check: Ensure only the hardcoded admin can withdraw
        let admin_pubkey = ADMIN_ADDRESS.parse::<Pubkey>().unwrap();
        require_keys_eq!(
            ctx.accounts.authority.key(),
            admin_pubkey,
            CustomError::Unauthorized
        );

        // Step 1: Withdraw Token A from the contract to the admin's account
        if amount_token_a > 0 {
            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        authority: ctx.accounts.vault_authority.to_account_info(), // Contract's PDA
                        from: ctx.accounts.vault_token_a_ata.to_account_info(), // Contract's Token A vault
                        to: ctx.accounts.authority_token_a_ata.to_account_info(), // Admin's Token A ATA
                    },
                    &[&[b"vault", &[ctx.bumps.vault_authority]]],
                ),
                amount_token_a,
            )?;
        }

        // Step 2: Withdraw Token B from the contract to the admin's account
        if amount_token_b > 0 {
            anchor_spl::token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        authority: ctx.accounts.vault_authority.to_account_info(), // Contract's PDA
                        from: ctx.accounts.vault_token_b_ata.to_account_info(), // Contract's Token B vault
                        to: ctx.accounts.authority_token_b_ata.to_account_info(), // Admin's Token B ATA
                    },
                    &[&[b"vault", &[ctx.bumps.vault_authority]]],
                ),
                amount_token_b,
            )?;
        }

        Ok(())
    }

    pub fn initialize_price(ctx: Context<InitializePrice>, initial_price: u64) -> Result<()> {
        let price_account = &mut ctx.accounts.price_account;
        price_account.price = initial_price;
        Ok(())
    }

    pub fn get_price(ctx: Context<GetPrice>) -> Result<u64> {
        let price_account = &ctx.accounts.price_account;
        Ok(price_account.price)
    }

    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        let price_account = &mut ctx.accounts.price_account;
        price_account.price = new_price;
        Ok(())
    }

    pub fn approve(ctx: Context<ApproveToken>, amount: u64) -> Result<()> {
        anchor_spl::token::approve(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Approve {
                    to: ctx.accounts.from_ata.to_account_info(),
                    authority: ctx.accounts.from.to_account_info(),
                    delegate: ctx.accounts.delegate.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn burn(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        anchor_spl::token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from_ata.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn change_mint_authority(
        ctx: Context<ChangeMintAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        anchor_spl::token::set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.current_authority.to_account_info(),
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens, // AuthorityType is an enum
            Some(new_authority),
        )?;
        Ok(())
    }
}
