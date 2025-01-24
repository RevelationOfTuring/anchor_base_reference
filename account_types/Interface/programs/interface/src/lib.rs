use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenInterface;

declare_id!("JCY5piHtM5LMxk2LHD31UhEAMtCT1vpTPozhnUC2xRV6");

#[program]
pub mod interface {
    use super::*;

    pub fn check_interface(ctx: Context<CheckInterface>) -> Result<()> {
        msg!("{:?}", ctx.accounts.token_program.programdata_address()?);
        Ok(())
    }
}

// Interface: Type validating that the account is one of a set of given Programs
// The Interface wraps over the Program, allowing for multiple possible program ids.
// Useful for any program that implements an instruction interface. For example, spl-token and spl-token-2022 both implement the spl-token interface.
#[derive(Accounts)]
pub struct CheckInterface<'info> {
    pub token_program: Interface<'info, TokenInterface>,
}
