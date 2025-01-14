import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { InstructionAttribute } from "../target/types/instruction_attribute";
import { Keypair } from "@solana/web3.js"

describe("instruction_attribute", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  console.log('signer address: ', wallet.publicKey.toString());

  const program = anchor.workspace.InstructionAttribute as Program<InstructionAttribute>;
  const newAccountKey = new Keypair();

  it("Create account with input length", async () => {
    // instruction data
    const data = new BN(1024); // u128
    const s = 'hello michael'; // string


    const txSig = await program.methods
      .initialize(s, data)
      .accounts({
        signer: wallet.publicKey,
        newAccount: newAccountKey.publicKey,
      })
      .signers([newAccountKey])
      .rpc();

    console.log(`tx sig: ${txSig}`)

    // fetch the account created
    const accCreated = await program.account.newAccount.fetch(
      newAccountKey.publicKey
    );

    console.log(`fields in account created: [${accCreated.stringData}] and [${accCreated.uData}]`)
  });
});
