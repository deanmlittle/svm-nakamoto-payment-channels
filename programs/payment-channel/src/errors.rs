use anchor_lang::prelude::*;

#[error_code]
pub enum PaymentChannelError {
    #[msg("Counter must be >= previous counter")]
    InvalidCounter,
    #[msg("Invalid Payee")]
    InvalidPayee,
    #[msg("Invalid Payer")]
    InvalidPayer,
    #[msg("Invalid Blockhash")]
    InvalidBlockhash,
    #[msg("Channel is time locked")]
    InvalidLockTime,
    #[msg("Invalid instruction")]
    InvalidInstruction,
    #[msg("Invalid instruction index")]
    InvalidInstructionIndex,
    #[msg("Channel has already been finalized")]
    ChannelAlreadyFinalized,
    #[msg("Missing signature instruction")]
    MissingSignatureInstruction,
    #[msg("Missing account")]
    MissingAccount,
    #[msg("Invalid signature header")]
    InvalidSignatureHeader
}