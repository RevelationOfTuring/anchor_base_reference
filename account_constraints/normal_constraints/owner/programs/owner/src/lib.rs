use anchor_lang::prelude::*;

declare_id!("AyHc8n1kFe593yakVhcmqJcte73gMX6CK7Yg1mKkdC4d");

#[program]
pub mod owner {
    use super::*;

    pub fn owner_constraint_1(ctx: Context<OwnerConstraint1>) -> Result<()> {
        msg!("the owner of the account: {:?}", ctx.accounts.account.owner);
        msg!("the program id: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn owner_constraint_2(ctx: Context<OwnerConstraint2>) -> Result<()> {
        msg!("the owner of the account: {:?}", ctx.accounts.account.owner);
        msg!(
            "the id of system program: {:?}",
            ctx.accounts.system_program.key()
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct OwnerConstraint1<'info> {
    /// CHECK: check the owner of the account is current program
    #[account(
        owner = crate::ID,
    )]
    pub account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct OwnerConstraint2<'info> {
    /// CHECK: check the owner of the account is system program
    #[account(
        owner = system_program.key(),
    )]
    pub account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
