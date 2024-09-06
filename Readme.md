# Nakamoto Payment Channels

The following contract presents a novel approach to off-chain scaling, repurposing existing wallet and RPC infrastructure to enable L1-validated [Nakamoto-style payment channels](https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2013-April/002417.html). In Nakamoto payment channels, participants:

1. Timelock some funds in a channel account with pre-determined unlocking condition(s).
2. Create multiple version of the unlocking transaction offchiin, incrementing a counter each time.
3. Periodically commit the latest version of the transaction to the chain.
4. Wait for the timelock to resolve the most recently comitted transaction, or unanimously sign to unlock the channel early.


2. The parties create multiple versions of off-chain transactions updating 
2. The funds can be released before the time lock expired provided participants' agreed-upon conditions are met.
2. 
At each state transition, a non-final 

1. Open a channel between N>1 participants
2. Commit function
3. Finalize