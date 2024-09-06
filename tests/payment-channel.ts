import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PaymentChannel } from "../target/types/payment_channel";
import { BN } from "bn.js";
import { randomBytes } from "crypto"
import { AccountMeta, Ed25519Program, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { assert } from "chai";

describe("payment-channel", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const nonce = new BN(randomBytes(8));

  const program = anchor.workspace.PaymentChannel as Program<PaymentChannel>;

  const provider = anchor.getProvider();

  const connection = provider.connection;

  const [payer, payee] = new Array(2).fill(0).map(Keypair.generate);

  const channel = PublicKey.findProgramAddressSync([Buffer.from("channel"), payer.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)], program.programId)[0];

  const commitTransaction = (payer: Keypair, payee: PublicKey | Keypair, counter: anchor.BN): Transaction => {
    const payeeMeta: AccountMeta = payee instanceof PublicKey ? { pubkey: payee, isSigner: false, isWritable: true } : { pubkey: payee.publicKey, isSigner: true, isWritable: true };
    const ix = new TransactionInstruction({
      programId: program.programId,
      keys: [
        {
          pubkey: payer.publicKey,
          isSigner: true,
          isWritable: true,
        },
        payeeMeta
      ],
      data: counter.toArrayLike(Buffer, "le", 8)
    });

    let signers = [payer];
    if (payee instanceof Keypair) {
      signers.push(payee)
    }

    let tx = new Transaction();
    tx.instructions = [ix];
    tx.feePayer = payer.publicKey,
    tx.recentBlockhash = new PublicKey(channel.toBuffer()).toBase58(),
    tx.sign(...signers)
    return tx
  }

  // 01 458aeb7f78378bae71fae8733f8162f77718d6aff8088a55538d0be064a399798eb2b8a73d89322d361e6ecfdd6fc4777f817c4ff04ecdcebbf4222d7477310f 01000103832ce74de2b15f7d89307aa072cc6f24018f590988e1fee290815422c639a3ccf955b9fad28120a83e8a608495085cb2e415eeecefa64ab6cea7396dc21df3ddeb2467a833cc03b9cda9a8598de50cfa32da7e973a12b1ffe597786cc029ae16805a300cde9afea32aedd07550537fb863978a76afe70d9fdba22be0b823c73c0102020001086400000000000000
  // 01000103832ce74de2b15f7d89307aa072cc6f24018f590988e1fee290815422c639a3ccf955b9fad28120a83e8a608495085cb2e415eeecefa64ab6cea7396dc21df3ddeb2467a833cc03b9cda9a8598de50cfa32da7e973a12b1ffe597786cc029ae16805a300cde9afea32aedd07550537fb863978a76afe70d9fdba22be0b823c73c0102020001086400000000000000

  const createSignatureOffset = (signatureOffset: number, publicKeyOffset: number, messageDataOffset: number, messageDataSize: number): Buffer => {
    return Buffer.concat([
      new BN(signatureOffset).toArrayLike(Buffer, "le", 2),
      new BN(0xffff).toArrayLike(Buffer, "le", 2),
      new BN(publicKeyOffset).toArrayLike(Buffer, "le", 2),
      new BN(0xffff).toArrayLike(Buffer, "le", 2),
      new BN(messageDataOffset).toArrayLike(Buffer, "le", 2),
      new BN(messageDataSize).toArrayLike(Buffer, "le", 2),
      new BN(0xffff).toArrayLike(Buffer, "le", 2),      
    ])
  }

  const commitTransactionInstruction = (payer: Keypair, payee: PublicKey | Keypair, counter: anchor.BN): TransactionInstruction => {
    const tx = commitTransaction(payer, payee, counter);
    let { signatures } = tx;
    let message = tx.serializeMessage();
    let signaturesOffset = 2 + 14 * signatures.length;
    let dataOffset = signaturesOffset + 64 * signatures.length;
    let pubkeysOffset = dataOffset + 4;
    let signatureHeader: Buffer = new BN(signatures.length).toArrayLike(Buffer, "le", 2);
    let signatureOffsets: Buffer = Buffer.concat(signatures.map((_, i) => {
      return createSignatureOffset(signaturesOffset + i*64, pubkeysOffset + i*32, dataOffset, message.length)
    }))
    let signaturesBuffers = Buffer.concat(signatures.map((s) => s.signature));
    const data = Buffer.concat([
      signatureHeader,
      signatureOffsets,
      signaturesBuffers,
      message
    ])

    const ix = new TransactionInstruction({
      programId: Ed25519Program.programId,
      keys: [],
      data
    });
    
    return ix
  }

  const confirm = async (signature: string): Promise<string> => {

    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );
    return signature;
  };

  it("Airdrop", async () => {
    let tx = new Transaction();
    tx.instructions = [
      ...[payer, payee].map((account) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: account.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      )
    ]

    commitTransaction(payer, payee.publicKey, new BN(100));

    await provider.sendAndConfirm(tx).then(log);
  })

  it("Open Channel", async () => {
    // Get current slot and add 100,000 to it
    let slot = (await connection.getSlot()) + 20;
    // Initialize the nonce account
    const tx = await program.methods.openChannel(
      nonce,
      new BN(10000000),
      new BN(1000),
      new BN(slot), 
      payee.publicKey
    )
    .accountsPartial({
      payer: payer.publicKey,
      channel,
    })
    .signers([
      payer
    ])
    .rpc({ skipPreflight: true })
    .then(confirm)
    .then(log)
  });

  it("Commit", async () => {
    let tx = await program.methods.commitState()
    .postInstructions([
      commitTransactionInstruction(payer, payee.publicKey, new BN(100))
    ])
    .accountsPartial({
      payer: payer.publicKey,
      channel,
      transaction: SYSVAR_INSTRUCTIONS_PUBKEY
    })
    .signers([payer])
    .rpc({ skipPreflight: true })
    .then(confirm)
    .then(log)
    let channelData = await program.account.channel.fetch(channel);
    console.log(channelData)
  });

  it("Fail to commit", async () => {
    try {
      let tx = await program.methods.commitState()
      .postInstructions([
        commitTransactionInstruction(payer, payee.publicKey, new BN(100))
      ])
      .accountsPartial({
        payer: payer.publicKey,
        channel,
        transaction: SYSVAR_INSTRUCTIONS_PUBKEY
      })
      .signers([payer])
      .rpc()
    } catch(e) {1
      if ((e as anchor.AnchorError).error.errorCode.code !== "InvalidCounter") {
        throw new Error("Unknown error")
      }
    }
  });

  it("Commit", async () => {
    let tx = await program.methods.commitState()
    .postInstructions([
      commitTransactionInstruction(payer, payee.publicKey, new BN(200))
    ])
    .accountsPartial({
      payer: payer.publicKey,
      channel,
      transaction: SYSVAR_INSTRUCTIONS_PUBKEY
    })
    .signers([payer])
    .rpc({ skipPreflight: true })
    .then(confirm)
    .then(log)
    let channelData = await program.account.channel.fetch(channel);
    console.log(channelData)
  });

  it("Finalize", async () => {
    let tx = await program.methods.finalizeState()
    .postInstructions([
      commitTransactionInstruction(payer, payee, new BN(201))
    ])
    .accountsPartial({
      payer: payer.publicKey,
      channel,
      transaction: SYSVAR_INSTRUCTIONS_PUBKEY
    })
    .signers([payer])
    .rpc({ skipPreflight: true })
    .then(confirm)
    .then(log)

    let channelData = await program.account.channel.fetch(channel);
    console.log(channelData)
  });

  it("Close", async () => {
    let tx = await program.methods.closeChannel()
    .accountsPartial({
      payer: payer.publicKey,
      payee: payee.publicKey,
      channel
    })
    .rpc({ skipPreflight: true })
    .then(confirm)
    .then(log)
  });
});