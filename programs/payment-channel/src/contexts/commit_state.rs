use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions;

use crate::commands::UpdateTransaction;
use crate::{Channel, PaymentChannelError};

#[derive(Accounts)]
pub struct CommitState<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        mut,
        constraint = channel.counter != u64::MAX @ PaymentChannelError::ChannelAlreadyFinalized,
    )]
    channel: Account<'info, Channel>,
    #[account(
        address = instructions::ID,
        constraint = transaction.recent_blockhash == channel.key().to_bytes() @ PaymentChannelError::InvalidBlockhash,
        constraint = transaction.update.accounts.payer.pubkey == channel.payer.key() @ PaymentChannelError::InvalidPayer,
        constraint = transaction.update.accounts.payee.pubkey == channel.payee.key() @ PaymentChannelError::InvalidPayee,
        constraint = transaction.update.args.counter > channel.counter @ PaymentChannelError::InvalidCounter,
    )]
    transaction: Account<'info, UpdateTransaction>
}

impl<'info> CommitState<'info> {
    pub fn commit_state(&mut self) -> Result<()> {
        self.channel.increment_counter(self.transaction.update.args.counter)
    }

}