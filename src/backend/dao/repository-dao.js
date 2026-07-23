const demoRepository = require("../repositories/demo-repository");
const sqlRepository = require("../repositories/sql-repository");

let activeRepository = null;

async function resolveRepository() {
  if (process.env.PREDICEX_MODE === "demo") return demoRepository;
  if (activeRepository) return activeRepository;
  await sqlRepository.health();
  activeRepository = sqlRepository;
  return activeRepository;
}

function reset() {
  activeRepository = null;
}

module.exports = { reset, resolveRepository };
