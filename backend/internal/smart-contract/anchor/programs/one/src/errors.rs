use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Can not mint more tokens")]
    CapExceed,

    #[msg("Invalid Token A mint address.")]
    InvalidTokenAMint,

    #[msg("Invalid Token B mint address.")]
    InvalidTokenBMint,

    #[msg("Insufficient Token B balance in the contract.")]
    InsufficientTokenBBalance,

    #[msg("Swap amount too small to receive Token B.")]
    AmountTooSmall,

    #[msg("Price must be greater than zero.")]
    InvalidPrice, // Added this variant

    #[msg("Error in token amount calculation.")]
    CalculationError, // Added this variant

    #[msg("Unauthorized access: Only the admin can withdraw funds.")]
    Unauthorized,
}
