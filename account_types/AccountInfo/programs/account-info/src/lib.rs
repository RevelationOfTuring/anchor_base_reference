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

// AccountInfo: 提供对账户的低级访问，包括账户的pubkey、lamports、owner和其他元数据。
// 它不自动处理data的反序列化，让开发者可以手动处理账户数据。
// 使用场景：用于处理不由当前合约管理的账户，或者当你需要直接访问和操作账户的底层数据时，如进行资金转移、查询账户余额等。
#[derive(Accounts)]
pub struct CheckAccountInfo<'info> {
    // AccountInfo can be used as a type but Unchecked Account should be used instead
    /// CHECK: AccountInfo is an unchecked account and fits any account 
    pub unchecked_account: AccountInfo<'info>,
}
