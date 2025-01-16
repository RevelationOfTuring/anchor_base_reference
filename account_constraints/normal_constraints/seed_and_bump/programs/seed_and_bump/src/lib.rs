use anchor_lang::prelude::*;

declare_id!("GghKdoLmQ1riHiDwKaKvJQvrmcZkxSkK4E87Laz26s26");

#[program]
pub mod seed_and_bump {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, i: u32) -> Result<()> {
        msg!("Initialize data: {}", i);
        ctx.accounts.new_account.i = i;
        msg!("PDA bump seed: {}", ctx.bumps.new_account);
        // store the bump(canonical bump) used in new_account creation
        ctx.accounts.new_account.bump = ctx.bumps.new_account;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, new_i: u32) -> Result<()> {
        msg!("Update data: {}", new_i);
        ctx.accounts.existing_account.i = new_i;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Update<'info> {
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"my custom seed", signer.key().as_ref()],
        bump = existing_account.bump,
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
        space = 8 + 4 + 1,
        // Checks that given account is a PDA derived from the currently executing program, the seeds, and if provided, 
        // the bump. If not provided, anchor uses the canonical bump.
        // Add seeds::program = <expr> to derive the PDA from a different program than the currently executing one.
        seeds = [b"my custom seed", signer.key().as_ref()],
        bump, // use canonical bump

    )]
    pub new_account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    i: u32,   // 4 bytes
    bump: u8, // 1 byte
}
