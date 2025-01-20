use anchor_lang::prelude::*;

declare_id!("9Agfmx6ZpcHseJp7JSGmXwHzXDCF49mpHCc9GASeX1Vb");

#[program]
pub mod constraint {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i1: u8, i2:u8) -> Result<()> {
        ctx.accounts.account1.i = i1;
        ctx.accounts.account2.i = i2;
        Ok(())
    }

    pub fn custom_constraint(ctx: Context<CustomConstraint>) -> Result<()> {
        msg!(r"account1 i: {}
account2 i: {}", ctx.accounts.account1.i, ctx.accounts.account2.i);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CustomConstraint<'info>{
    // Constraint that checks whether the given expression evaluates to true. 
    // Use this when no other constraint fits your use case.
    #[account(
        constraint = account1.i < account2.i,
    )]
    pub account1: Account<'info,AccountData>,
    pub account2: Account<'info,AccountData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init, 
        payer = signer,
        space = 8 + 1,
    )]
    pub account1: Account<'info, AccountData>,
    #[account(
        init, 
        payer = signer,
        space = 8 + 1,
    )]
    pub account2: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    i: u8,
}
