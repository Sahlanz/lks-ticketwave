module.exports = {
  apps: [
    {
      name: 'ticketwave-app',
      script: 'app.js',
      env_file: '.env',
      max_restarts: 10,
      restart_delay: 3000,
      watch: false
    },
    {
      name: 'ticketwave-worker',
      script: 'worker.js',
      env_file: '.env',
      max_restarts: 10,
      restart_delay: 3000,
      watch: false
    }
  ]
};
