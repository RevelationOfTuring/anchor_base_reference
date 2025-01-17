use anchor_lang::prelude::*;

declare_id!("A76CH7vMEy9PqiBrJH7PRg7HufFRV3XKJWvFbya823jN");

#[program]
pub mod executable {
    use super::*;

    pub fn executable_check(ctx: Context<ExecutableCheck>) -> Result<()> {
        msg!("account: {:?}", ctx.accounts.account.key);
        msg!("account executable: {:?}", ctx.accounts.account.executable);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ExecutableCheck<'info> {
    // Checks the account is executable (i.e. the account is a program). You may want to use the Program type instead.
    /// CHECK: check account is executable
    #[account(executable)]
    pub account: UncheckedAccount<'info>,
}
