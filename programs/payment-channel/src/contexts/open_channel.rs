use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::Channel;

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct OpenChannel<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + Channel::INIT_SPACE,
        seeds = [b"channel", payer.key().as_ref(), nonce.to_le_bytes().as_ref()],
        bump
    )]
    channel: Account<'info, Channel>,
    system_program: Program<'info, System>
}

impl<'info> OpenChannel<'info> {
    pub fn open_channel(&mut self, nonce: u64, rate: u64, locktime: u64, payee: Pubkey, bump: u8) -> Result<()> {
        self.channel.set_inner(Channel {
            payer: self.payer.key(),
            payee,
            nonce,
            rate,
            counter: 0,
            locktime,
            bump,
        });
        Ok(())
    }

    pub fn deposit(&mut self, spend_limit: u64) -> Result<()> {
        let accounts = Transfer {
            from: self.payer.to_account_info(),
            to: self.channel.to_account_info()
        };

        let ctx = CpiContext::new(
            self.system_program.to_account_info(), 
            accounts
        );

        transfer(ctx, spend_limit)
    }
}