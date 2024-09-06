# Nakamoto Payment Channels

The following contract presents a novel approach to off-chain scaling, repurposing existing wallet and RPC infrastructure to enable L1-validated [Nakamoto-style payment channels](https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2013-April/002417.html). In Nakamoto payment channels, participants will:


1. Timelock some funds behing a contract with some pre-determined unlocking conditions
2. Create multiple version of the unlocking transaction offchain, incrementing a counter each time.
3. When they wish to resolve the channel, either:
    - Publish the version of the transaction with the highest counter once the timelock matures, or:
    - Unanimously sign to finalize the channel before the timelock matures.

By these simple rules, it is possible to scale onchain activity on a private server, or via direct peer-to-peer communications, without forgoing any of the protections and execution guarantees that an L1 blockchain provides.

### SVM-specific implementation details
By utilising the channel address as the blockhash of the transaction and changing to a custom RPC, we can make as many off-chain transactions as we like, using the transaction format itself as a data envelope. This is then subsequently validated by the contract using the Ed25519Signature instruction.

To make this as painless as possible, we leverage several other libraries:

__Solana Transaction Introspection__ - We leverage [solana-transaction-introspection](https://github.com/deanmlittle/solana-transaction-introspection) to handle verification, deserialization, and enforcement of account metas. It also enables us to define generic types that can be leveraged for both account struct and instruction deserialization.
__Ed25519Instruction Deserialization__ - We leverage [solana-ed25519-instruction](https://github.com/deanmlittle/solana-ed25519-instruction) to deserialize the signature instruction.

