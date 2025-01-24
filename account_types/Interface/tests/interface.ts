import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Interface } from "../target/types/interface";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("interface", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Interface as Program<Interface>;

  it("Pass with token program and token 2022 program", async () => {
    await program.methods.checkInterface()
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    await program.methods.checkInterface()
      .accounts({
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
  });

  it("Fail with the program itself", async () => {
    try {
      await program.methods.checkInterface()
        .accounts({
          tokenProgram: program.programId,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(err.logs[2], "Program log: AnchorError caused by account: token_program. Error Code: InvalidProgramId. Error Number: 3008. Error Message: Program ID was not as expected.");
    }
  });
});
