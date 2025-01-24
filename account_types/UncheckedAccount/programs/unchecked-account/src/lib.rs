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

// UncheckedAccount:  用于表示一个账户，其数据不会在运行时被Anchor自动解码或验证。这意味着Anchor不会自动处理这个账户的数据结构和类型安全检查。
// 使用场景: 此类型通常用于以下情况：
//      - 当program开发者需要完全控制对账户的低级访问时。
//      - 在处理一些特定的外部账户时，这些账户可能没有预定义的数据结构，需要开发者自行解析和验证数据。
//      - 当需要优化性能，避免自动数据解析带来的开销时。
#[derive(Accounts)]
pub struct CheckUncheckedAccount<'info> {
    /// CHECK: UncheckedAccount is an explicit wrapper for AccountInfo types to emphasize that no checks are performed
    pub unchecked_account: UncheckedAccount<'info>,
}
