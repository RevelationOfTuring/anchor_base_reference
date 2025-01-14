use anchor_lang::prelude::*;

declare_id!("9kjjzParbe5pPdiZBPK7uBWZ5GkBxcos8TQUGsQKCnwC");

#[program]
pub mod instruction_attribute {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, s: String, data: u128) -> Result<()> {
        msg!("Initialize data to: {} and {}", s, data);
        ctx.accounts.new_account.string_data = s;
        ctx.accounts.new_account.u_data = data;

        Ok(())
    }
}

#[derive(Accounts)]
// You can access the instruction’s arguments with the #[instruction(..)] attribute.
// You have to list them in the same order as in the instruction but you can omit all arguments after the last one you need.
#[instruction(s: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        // 8 for discriminator, 
        // 4 for the string length and s.len() for the content of string,
        // 16 for u128
        space = 8 + 4 + s.len() + 16,
    )]
    pub new_account: Account<'info, NewAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct NewAccount {
    string_data: String,
    u_data: u128,
}
