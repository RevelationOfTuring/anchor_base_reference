use anchor_lang::prelude::*;

declare_id!("2GDRyg4y5JfcxxwXWxZx6BpyiEjS6Ep2DecCkpWDzWRg");

#[program]
pub mod signer {
    use super::*;

    pub fn signer_check(ctx: Context<SignerCheck>) -> Result<()> {
        msg!("Passed the check of signer: {:?}", ctx.accounts.signer.key);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SignerCheck<'info> {
    // Checks the given account signed the transaction.
    // Consider using the Signer type if you would only have this constraint on the account.
    // Custom errors are supported via @.
    /// CHECK: signer constraint
    #[account(signer)]
    pub signer: UncheckedAccount<'info>,
}
