use anchor_lang::prelude::*;

declare_id!("J4iXBdmUkfhdvf6YornqE6pCx5Vo7YM48GFLqJKAuQJm");

#[program]
pub mod has_one {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u64) -> Result<()> {
        msg!("set i in AccountData: {}", i);
        ctx.accounts.new_account.i = i;
        msg!("set owner in AccountData: {:?}", ctx.accounts.signer.key);
        ctx.accounts.new_account.owner = *ctx.accounts.signer.key;
        Ok(())
    }

    pub fn update_data(ctx: Context<UpdateData>, new_i: u64) -> Result<()> {
        msg!("change i in AccountData to: {}", new_i);
        ctx.accounts.existing_account.i = new_i;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct UpdateData<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        // Checks the target_account field on the account matches the key of the target_account field in the Accounts struct.
        // Custom errors are supported via @.
        // e.g: check that existing_account.owner == UpdateData.owner.key()
        has_one = owner,
    )]
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
    i: u64,        // 8 bytes
    owner: Pubkey, // 32 bytes
}
