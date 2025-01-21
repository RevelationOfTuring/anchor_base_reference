use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

declare_id!("HKFCEs4ng353zkgXzRRwyfVEhRiMawy2SWJJCiyDXhu9");

#[program]
pub mod create_mint {
    use super::*;

    pub fn create_mint(_ctx: Context<CreateMint>) -> Result<()> {
        Ok(())
    }

    pub fn validate_mint(_ctx: Context<ValidateMint>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    // Create a mint account with the given mint decimals and mint authority.
    // The freeze authority is optional when used with init.
    #[account(
        init,
        payer = signer,
        mint::decimals = 9,
        mint::authority = signer,
        mint::freeze_authority = signer,
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateMint<'info> {
    pub signer: Signer<'info>,

    // It's possible to only specify a subset of the constraints.
    #[account(
        mint::authority = signer,
        mint::freeze_authority = signer,
    )]
    pub mint: Account<'info, Mint>,
}
