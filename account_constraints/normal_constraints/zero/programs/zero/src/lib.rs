use anchor_lang::prelude::*;

declare_id!("2h6xUH6T6695e8Ebvp2TpmbLeKdLd2tu6MriZq8c5RMu");

#[program]
pub mod zero {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // AccountLoader.load_init() returns a `RefMut` to the account data structure for reading or writing.
        // It should only be called once, when the account is being initialized.
        // 注：初始化后，account.data中的10240个元素都是用0来填充
        let account = ctx.accounts.account.load_init()?;
        msg!("Account data size is: {:?}", account.data.len());
        Ok(())
    }

    pub fn update(ctx: Context<Update>, index: u16, i: u8, start: u16, end: u16) -> Result<()> {
        // Load account
        // AccountLoader.load_mut() returns a `RefMut` to the account data structure for reading or writing.
        let mut account = ctx.accounts.existing_account.load_mut()?;
        // let account = &mut ctx.accounts.existing_account.load_mut()?;

        // Update the data at index
        account.data[index as usize] = i;

        // Get [start:end) data
        let len = account.data.len();
        let start_index = start as usize;
        let end_index = (end as usize).min(len);
        let target_slice = &account.data[start_index..end_index];

        msg!(
            r"Data length [{}]
Update data [{}] at index [{}]
[{}..{}] Data: {:?}",
            len,
            i,
            index,
            start_index,
            end_index,
            target_slice
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub existing_account: AccountLoader<'info, AccountData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(zero)]
    // Checks the account discriminator is zero.
    // Use this constraint if you want to create an account in a previous instruction and then initialize it in your instruction instead of using init.
    // This is necessary for accounts that are larger than 10 Kibibyte because those accounts cannot be created via a CPI (which is what init would do).
    // NOTE: Anchor adds internal data to the account when using `zero` just like it does with `init` which is why zero implies mut.
    pub account: AccountLoader<'info, AccountData>,
}

// A data structure that can be used as an internal field for a zero copy deserialized account,
// i.e., a struct marked with #[account(zero_copy)].
#[account(zero_copy)]
pub struct AccountData {
    // if the type of data is [u8;10240], please add
    //      bytemuck = { version = "1.21.0", features = [ "min_const_generics"] }
    // to the dependencies of Cargo.toml
    data: [u8; 10240],
}

// 注：bytemuck是一个第三方依赖，它可以使你在不改变底层存储的bit的情况下在不同的类型之间进行转换（即"bit cast"操作）。
// 其"min_const_generics" feature可以使用在所有长度的数组之上，而并不是仅仅适用于一系列指定长度的数组。
