use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

declare_id!("4B676iQad6fytMqFCMHHDnWeTMkvwrTzda39xfw99heD");

#[program]
pub mod account {
    use super::*;

    pub fn create_account(ctx: Context<CreateAccount>, i1: u128, i2: u64) -> Result<()> {
        ctx.accounts.new_account1.i = i1;
        ctx.accounts.new_account2.i1 = i2;
        ctx.accounts.new_account2.i2 = i2;
        Ok(())
    }

    pub fn check_account(ctx: Context<CheckAccount>) -> Result<()> {
        // custom account
        msg!(r"Account Data: {}", ctx.accounts.my_account1.i);

        // spl token account
        msg!(
            r"spl token account:
    owner: {}
    mint: {}
    amount: {}",
            ctx.accounts.token_account.owner,
            ctx.accounts.token_account.mint,
            ctx.accounts.token_account.amount,
        );

        // spl mint account
        msg!(
            r"spl mint account:
    decimals: {}
    mint_authority: {:?}
    freeze_authority: {:?}
    supply: {}",
            ctx.accounts.mint_account.decimals,
            ctx.accounts.mint_account.mint_authority,
            ctx.accounts.mint_account.freeze_authority,
            ctx.accounts.mint_account.supply,
        );

        Ok(())
    }
}

// Account: 用于定义一个由program管理的struct。这些struct映射到链上的account，并由 Anchor 自动处理序列化和反序列化。
// 使用场景：当需要在区块链上持久化存储结构化数据时，如用户资料、游戏状态或任何其他应用特定数据可以使用该修饰器
#[derive(Accounts)]
pub struct CheckAccount<'info> {
    // Account container that checks ownership on deserialization
    pub my_account1: Account<'info, AccountData1>,
    pub mint_account: Account<'info, Mint>,
    pub token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 4 + 16,
    )]
    pub new_account1: Account<'info, AccountData1>,
    #[account(
        init,
        payer = signer,
        space = 8 + 4 + 16,
    )]
    pub new_account2: Account<'info, AccountData2>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData1 {
    i: u128,
}

#[account]
pub struct AccountData2 {
    i1: u64,
    i2: u64,
}
