use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("7asmsfKynRQHXpGpKVyHTQ7i35PjaN41y5jnzQNuHyFE");

#[program]
pub mod mut_constraint {
    use super::*;

    pub fn mut_constraint(ctx: Context<MutConstraint>, amount: u64) -> Result<()> {
        // transfer SOL via a CPI, both the `from` and `to` accounts must be mutable
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MutConstraint<'info> {
    // Checks the given account is mutable. 
    // Makes anchor persist any state changes. 
    // Custom errors are supported via @.
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
