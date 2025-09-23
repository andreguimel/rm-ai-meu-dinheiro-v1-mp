// Teste das importações das constantes
import { NUMBER_FORMATS, DATE_FORMATS } from "./constants";

console.log("Constantes carregadas:", JSON.stringify({ NUMBER_FORMATS, DATE_FORMATS }, null, 2));

export const testConstants = () => {
  return "Constantes OK";
};
