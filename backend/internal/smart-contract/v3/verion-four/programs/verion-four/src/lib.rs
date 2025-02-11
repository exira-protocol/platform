use anchor_lang::prelude::*;

declare_id!("BjJ49YJZLpvgb4ckbs25fz8Zfq1gEzsWMneTur7pwss7");

#[program]
pub mod verion_four {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
