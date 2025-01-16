use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("DQfaTUjm5GCz1bjPVTQwbEt3cfnVKsqPLxk65xSmUoAZ");

#[program]
pub mod init_if_needed {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u8) -> Result<()> {
        if ctx.accounts.new_account.is_initialized {
            msg!("Already initialized");
        } else {
            ctx.accounts.new_account.is_initialized = true;
            ctx.accounts.new_account.i = i;
            msg!("Initializing account with data {}", i);
        };
        Ok(())
    }

    pub fn intialize_token_account(ctx: Context<InitializeTokenAccount>) -> Result<()> {
        // No additional checks needed, token account checks are done by token program
        msg!("Initialize associated token account if needed");
        msg!(
            "Associated token account: {}",
            ctx.accounts.associated_token.key()
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeTokenAccount<'info> {
    #[account(mut)]
    pub signer_michael: Signer<'info>,
    #[account(
        init_if_needed,
        payer = signer_michael,
        associated_token::mint = mint,
        associated_token::authority = signer_michael,
    )]
    pub associated_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer_michael: Signer<'info>,
    #[account(
        // Exact same functionality as the init constraint but only runs if the account does not exist yet
        // This feature should be used with care and is therefore behind a feature flag. 
        // You can enable it by importing anchor-lang with the init-if-needed cargo feature. 
        // When using init_if_needed, you need to make sure you properly protect yourself against re-initialization attacks.
        init_if_needed,
        payer = signer_michael,
        space = 8 + 1 + 1,
    )]
    pub new_account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    i: u8,                // 1 byte
    is_initialized: bool, // 1 byte
}
