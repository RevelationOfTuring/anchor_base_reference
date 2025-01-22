use anchor_lang::prelude::*;

declare_id!("DiXBquwqbm6SN22RoDAdTcyWGUBKxqpu6MYpgVH5bVco");

#[program]
pub mod account_info {
    use super::*;

    pub fn check_account_info(ctx: Context<CheckAccountInfo>) -> Result<()> {
        msg!("AccountInfo: {:?}", ctx.accounts.unchecked_account);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CheckAccountInfo<'info> {
    // AccountInfo can be used as a type but Unchecked Account should be used instead
    /// CHECK: AccountInfo is an unchecked account and fits any account 
    pub unchecked_account: AccountInfo<'info>,
}
