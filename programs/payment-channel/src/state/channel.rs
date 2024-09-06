use anchor_lang::prelude::*;
use crate::PaymentChannelError;

#[account]
#[derive(InitSpace)]
pub struct Channel {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub counter: u64,
    pub rate: u64,
    pub nonce: u64,
    pub locktime: u64,
    pub bump: u8
}

impl Channel {
    pub fn finalize(&mut self) -> Result<()> {
        self.rate = self.rate.checked_mul(self.counter).ok_or(ProgramError::ArithmeticOverflow)?;
        self.counter = u64::MAX;
        Ok(())
    }

    pub fn increment_counter(&mut self, counter: u64) -> Result<()> {
        require_neq!(self.counter, u64::MAX, PaymentChannelError::ChannelAlreadyFinalized);
        require_gt!(counter, self.counter, PaymentChannelError::InvalidCounter);
        self.counter = counter;
        Ok(())
    }
}