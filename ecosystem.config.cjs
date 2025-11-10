// ecosystem.config.cjs (repo-roten)
module.exports = {
  apps: [
    { name: "mock-api", cwd: "services/mock-api", script: "server.js", node_args: "--env-file=../../.env", watch: true },
    { name: "nexus",    cwd: "services/nexus",    script: "server.js", node_args: "--env-file=../../.env", watch: true },
    { name: "c-core",   cwd: "services/c-core",   script: "server.js", node_args: "--env-file=../../.env", watch: true },
    { name: "infinity", cwd: "services/infinity", script: "server.js", node_args: "--env-file=../../.env", watch: true },
    { name: "finance",  cwd: "services/finance",  script: "server.js", node_args: "--env-file=../../.env", watch: true },
    { name: "orders",   cwd: "services/orders",   script: "server.js", node_args: "--env-file=../../.env", watch: true },
    {
      name: "status",
      cwd: "services/status",
      script: "server.js",
      node_args: "--env-file=../../.env",
      watch: true,
      // Sätter PORT så servern garanterat får en port även om STATUS_PORT saknas
      env: { PORT: 15300 }
    },
  ],
};
