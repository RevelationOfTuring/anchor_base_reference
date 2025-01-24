use anchor_lang::prelude::*;

declare_id!("7gKCVSiESoMVyN6kvx4BoH8UuSpremXehJYvJwBFH4Jh");

#[program]
pub mod account_loader {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, value: u8) -> Result<()> {
        // AccountLoader.load_init() returns a `RefMut` to the account data structure for reading or writing.
        // It should only be called once, when the account is being initialized.
        let new_account = &mut ctx.accounts.new_account.load_init()?;
        // set data
        new_account.data[1] = value;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, value: u8) -> Result<()> {
        //  AccountLoader.load_mut() returns a `RefMut` to the account data structure for reading or writing.
        let existing_account = &mut ctx.accounts.existing_account.load_mut()?;
        existing_account.data[1] = value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub existing_account: AccountLoader<'info, LargeData>,
}

// AccountLoader: 用于延迟加载账户数据，这对于处理大型数据结构特别有用，因为它允许program在需要时才加载数据，从而可以节省资源和提高执行效率。
// 使用场景：主要用于访问和操作数据量大的账户，例如大型的游戏状态、复杂的金融产品数据或任何大型数据集。
#[derive(Accounts)]
pub struct Initialize<'info> {
    // AccountLoader: Type facilitating on demand zero copy deserialization
    // Note that using accounts in this way is distinctly different from using the [`Account`].
    // Namely, one must call
    // - `load_init` after initializing an account (this will ignore the missing
    // account discriminator that gets added only after the user's instruction code)
    // - `load` when the account is not mutable
    // - `load_mut` when the account is mutable
    #[account(zero)] // check the discriminator is zero
    pub new_account: AccountLoader<'info, LargeData>,
}

// zero_copy attribute requires the import of 'bytemuck' crate
#[account(zero_copy)]
pub struct LargeData {
    data: [u8; 4096],
}
