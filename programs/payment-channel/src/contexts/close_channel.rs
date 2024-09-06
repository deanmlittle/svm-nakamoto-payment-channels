use std::cmp::min;

use anchor_lang::prelude::*;

use crate::{Channel, PaymentChannelError};

#[derive(Accounts, Clone)]
pub struct CloseChannel<'info> {
    #[account(mut)]
    /// CHECK: This is safe
    payee: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This is safe
    payer: UncheckedAccount<'info>,
    #[account(
        mut,
        close = payee,
        has_one = payer,
        has_one = payee,
        constraint = channel.counter == u64::MAX @ PaymentChannelError::InvalidCounter,
        seeds = [b"channel", payer.key().as_ref(), channel.nonce.to_le_bytes().as_ref()],
        bump = channel.bump,
    )]
    channel: Account<'info, Channel>,
}

impl<'info> CloseChannel<'info> {
    pub fn close_channel(&mut self) -> Result<()> {
        let balance = min(self.channel.get_lamports(), self.channel.rate);
        self.channel.sub_lamports(balance)?;
        self.payee.add_lamports(balance)?;
        Ok(())
    }
}