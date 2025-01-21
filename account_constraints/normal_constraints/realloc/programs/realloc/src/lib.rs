use anchor_lang::prelude::*;

declare_id!("6KfZGhbQvREKNzTzy8S2rewU97dycHbhCJcxAZ4ze8Ue");

#[program]
pub mod realloc {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, s: String) -> Result<()> {
        ctx.accounts.new_account.data = s;
        Ok(())
    }

    pub fn realloc_zero(_ctx: Context<ReallocZero>, _s: String) -> Result<()> {
        Ok(())
    }

    pub fn realloc_zero_and_fill(ctx: Context<ReallocZero>, s: String) -> Result<()> {
        ctx.accounts.account.data = s;
        Ok(())
    }

    pub fn realloc_non_zero(_ctx: Context<ReallocNonZero>, _s: String) -> Result<()> {
        Ok(())
    }

    pub fn realloc_non_zero_and_fill(ctx: Context<ReallocNonZero>, s: String) -> Result<()> {
        ctx.accounts.account.data = s;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(s:String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + 4 + s.len(),
    )]
    pub new_account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AccountData {
    data: String,
}

#[derive(Accounts)]
#[instruction(s:String)]
pub struct ReallocZero<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + 4 + s.len(),
        realloc::payer = signer,
        // Note: Memory used to grow is already zero-initialized upon program entrypoint and re-zeroing it wastes compute units.
        // If within the same call a program reallocs from larger to smaller and back to larger again the new space could contain stale data. 
        // Pass true for zero_init in this case, otherwise compute units will be wasted re-zero-initializing.
        realloc::zero = true,
    )]
    // Used to realloc program account space at the beginning of an instruction.

    // The account must be marked as mut and applied to either Account or AccountLoader types.
    // If the change in account data length is additive, lamports will be transferred from the realloc::payer into the program account in order to maintain rent exemption.
    // Likewise, if the change is subtractive, lamports will be transferred from the program account back into the realloc::payer.

    // The realloc::zero constraint is required in order to determine whether the new memory should be zero initialized after reallocation.
    pub account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(s:String)]
pub struct ReallocNonZero<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + 4 + s.len(),
        realloc::payer = signer,
        // 'realloc::zero = false' is most commonly used
        realloc::zero = false,
    )]
    pub account: Account<'info, AccountData>,
    pub system_program: Program<'info, System>,
}
