use anchor_lang::prelude::*;

declare_id!("EPHGo2vBdNrM3T7gDUSDHTXKnM2aD2zw1tQGJzuFgxZc");

#[program]
pub mod init {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u128, a: u64) -> Result<()> {
        ctx.accounts.new_account.i = i;
        ctx.accounts.new_account.a = a;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    // Creates the account via a CPI to the system program and
    // initializes it (sets its account discriminator).
    #[account(
        init,
        payer = signer,
        // 16=128/8, 8=64/8
        space = 8 + 16 + 8,
    )]
    pub new_account: Account<'info, AccountData>,
    // system_program field is required in the account validation struct
    // if 'init' constraint is in use
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    pub i: u128,
    pub a: u64,
}
