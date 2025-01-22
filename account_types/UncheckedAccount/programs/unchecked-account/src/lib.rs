use anchor_lang::prelude::*;

declare_id!("WvDikVDCE9d7GgA8pLtKyhNAKFyaEC46JQogvyNpDzp");

#[program]
pub mod unchecked_account {
    use super::*;

    pub fn check_unchecked_account(ctx: Context<CheckUncheckedAccount>) -> Result<()> {
        msg!("UncheckedAccount: {:?}", ctx.accounts.unchecked_account);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CheckUncheckedAccount<'info> {
    /// CHECK: UncheckedAccount is an explicit wrapper for AccountInfo types to emphasize that no checks are performed
    pub unchecked_account: UncheckedAccount<'info>,
}
