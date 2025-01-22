use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

declare_id!("58uk992dPFFWschJvPXXsB5K3rsdza6o9UuThVTNRGFV");

#[program]
pub mod override_token_program {
    use super::*;

    pub fn check_token_program(_ctx: Context<CheckTokenProgram>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CheckTokenProgram<'info> {
    #[account(
        mint::token_program = token_program,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}
