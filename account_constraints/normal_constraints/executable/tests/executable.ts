import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Executable } from "../target/types/executable";
import assert from "assert";

describe("executable", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Executable as Program<Executable>;

  it("Pass executable constraint", async () => {
    await program.methods.executableCheck()
      .accounts({
        account: program.programId,
      })
      .rpc();
  });

  it("Fail with executable constraint", async () => {
    try {
      await program.methods.executableCheck()
        .accounts({
          account: anchor.getProvider().publicKey,
        })
        .rpc();
    } catch (err) {
      assert.strictEqual(
        err.logs[2],
        "Program log: AnchorError caused by account: account. Error Code: ConstraintExecutable. Error Number: 2007. Error Message: An executable constraint was violated."
      );
    }
  });
});
