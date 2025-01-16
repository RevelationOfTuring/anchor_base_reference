use anchor_lang::prelude::*;

declare_id!("DceXgsvtum6DBxiMxxXXFj5cGzB8r8yRwNkyfQWEvAW3");

// hardcoded pubkey for address constraint
const HARDCODED_PUBKEY: Pubkey = pubkey!("2T1aDaVU4TFABpGUYipPQACLsL8WfAcMaUQuRK8B4itX");

#[program]
pub mod address {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u64) -> Result<()> {
        ctx.accounts.new_account.i = i;
        ctx.accounts.new_account.pubkey = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn update_data(ctx: Context<UpdateData>, new_i: u64) -> Result<()> {
        ctx.accounts.existing_account.i = new_i;
        Ok(())
    }

    pub fn only_hardcoded(ctx: Context<OnlyHardcoded>) -> Result<()> {
        msg!("signer is hardcoded: {:?}", *ctx.accounts.account.key);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct OnlyHardcoded<'info> {
    // Checks the account key matches the pubkey.
    // Custom errors are supported via @.
    /// CHECK: require the pubkey of account is HARDCODED_PUBKEY
    #[account(address = HARDCODED_PUBKEY)]
    pub account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct UpdateData<'info> {
    // Checks the account key matches the pubkey.
    // Custom errors are supported via @.
    #[account(address = existing_account.pubkey)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub existing_account: Account<'info, AccountData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 32,
    )]
    pub new_account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    i: u64,         // 8 bytes
    pubkey: Pubkey, // 32 bytes
}
