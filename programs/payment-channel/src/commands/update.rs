use solana_transaction_introspection::prelude::*;
use borsh::BorshDeserialize;

#[derive(TypedAccounts)]
pub struct UpdateAccounts {
    #[account(mut, signer)]
    pub payer: AccountMeta,
    #[account(mut)]
    pub payee: AccountMeta,
}

#[typed_instruction(owner = crate::ID, discriminator = [])]
pub struct Update {
    pub counter: u64
}

#[derive(FromSignedTransaction)]
pub struct UpdateTransaction {
    pub header: TransactionHeader,
    pub recent_blockhash: [u8;32],
    pub update: TypedInstruction<UpdateAccounts, Update>
}