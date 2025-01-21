use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("6LfqtNbezp2AvLg8ofwe5mhsnaaEmcBWbQnUVy8hmdRP");

#[program]
pub mod create_token_account {
    use super::*;

    pub fn create_token_account(_ctx: Context<CreateTokenAccount>) -> Result<()> {
        Ok(())
    }

    pub fn valdate_token_account(_ctx: Context<ValidateTokenAccount>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ValidateTokenAccount<'info> {
    pub signer: Signer<'info>,

    // It's possible to only specify a subset of the constraints.
    #[account(
        token::mint = mint,
        token::authority = signer,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct CreateTokenAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // Create a token account with the given mint address and authority
    #[account(
        init,
        payer = signer,
        token::mint = mint,
        token::authority = signer,
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}
