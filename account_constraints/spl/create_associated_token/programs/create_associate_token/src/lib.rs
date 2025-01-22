use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("CNjPekVCxSLbdDX7ykECFPKcbvRehh8yj8gfaNjjMPF7");

#[program]
pub mod create_associate_token {
    use super::*;

    pub fn create_associate_token(_ctx: Context<CreateAssociatedToken>) -> Result<()> {
        Ok(())
    }

    pub fn validate_associate_token(_ctx: Context<CheckAssociatedToken>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAssociatedToken<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // Create an associated token account with the given mint address and authority.
    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub associated_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct CheckAssociatedToken<'info> {
    pub signer: Signer<'info>,
    // Check an associated token account with the given mint address and authority.
    #[account(
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub associated_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
}
