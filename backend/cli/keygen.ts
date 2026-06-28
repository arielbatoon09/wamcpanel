import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function generateSftpKey() {
  const keyPath = path.resolve(process.cwd(), "sftp_host_key");

  // If the key already exists and is not empty, warn the user
  if (fs.existsSync(keyPath) && fs.readFileSync(keyPath, "utf8").trim()) {
    console.log("SFTP host key already exists at: " + keyPath);
    console.log("If you want to regenerate it, delete the existing file first.");
    return;
  }

  console.log("Generating a new 2048-bit RSA SFTP host key...");
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
  });

  fs.writeFileSync(keyPath, privateKey, "utf8");
  console.log("Success! SFTP host key created at: " + keyPath);
}

generateSftpKey();
