module.exports = {
  networks: {
    // Ganache GUI default (port 7545).
    // If you use Ganache CLI / ganache, change the port to 8545.
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
  },

  // Match the pragma in your contract.
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        // IMPORTANT: Ganache (older builds) does not support the newer
        // "shanghai" EVM's PUSH0 opcode. Compiling for "paris" avoids the
        // "invalid opcode" deployment error.
        evmVersion: "paris",
      },
    },
  },
};
