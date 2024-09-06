use anchor_lang::prelude::*;

pub mod contexts;
pub use contexts::*;

pub mod commands;
pub use commands::*;

pub mod state;
pub use state::*;

pub mod errors;
pub use errors::*;

declare_id!("B2pLPTTcybPm4axuTS9jurJ6DKEizNA7iooRpnjFxLcf");

#[program]
pub mod payment_channel {
    use super::*;

    /// # Initialize
    /// 
    /// Open a new payment channel between two participants with a fee rate, an expiry and a 
    pub fn open_channel(ctx: Context<OpenChannel>, nonce: u64, spend_limit: u64, rate: u64, locktime: u64, payee: Pubkey) -> Result<()> {
        ctx.accounts.open_channel(nonce, rate, locktime, payee, ctx.bumps.channel)?;
        ctx.accounts.deposit(spend_limit)
    }

    /// # Commit
    /// 
    /// Verifies a `Commit`` transaction from our payment channel. 
    /// If valid, update counter and amount as new lower bound for state rollback.
    pub fn commit_state(ctx: Context<CommitState>) -> Result<()> {
        ctx.accounts.commit_state()
    }

    /// # Finalize
    /// 
    /// Allow both parties to sign to finalize a channel before its locktime expires.
    pub fn finalize_state(ctx: Context<FinalizeState>) -> Result<()> {
        ctx.accounts.finalize_state()
    }

    /// # Close
    /// 
    /// Resolves a payment channel once it has been finalized, or its locktime has expired.
    pub fn close_channel(ctx: Context<CloseChannel>) -> Result<()> {
        ctx.accounts.close_channel()
    }
}