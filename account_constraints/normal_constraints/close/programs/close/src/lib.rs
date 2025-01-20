use anchor_lang::prelude::*;

declare_id!("Agq8YHbRvpowkU3fEd4EMPMFEyfH7BiTz9kHjWCUHbP1");

#[program]
pub mod close {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u64) -> Result<()> {
        ctx.accounts.account.i = i;
        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        msg!("Account close: {:?}", ctx.accounts.receiver);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    /// CHECK: receiver for the sol from account
    pub receiver: UncheckedAccount<'info>,
    /* 
        Closes the account by:
            - Sending the lamports to the specified account
            - Assigning the owner to the System Program
            - Resetting the data of the account
        Requires mut to exist on the account.
    */
    #[account(
        mut,
        close = receiver,
    )]
    pub account: Account<'info, AccountData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 8,
    )]
    pub account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    i: u64,
}
