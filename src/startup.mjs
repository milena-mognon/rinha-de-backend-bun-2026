import fs from 'node:fs';
import zlib from 'node:zlib';

export const normalization = JSON.parse(
  fs.readFileSync(new URL('../resources/normalization.json', import.meta.url))
);

export const mccRiskData = JSON.parse(
  fs.readFileSync(new URL('../resources/mcc_risk.json', import.meta.url))
);

const references = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(new URL('../resources/references.json.gz', import.meta.url))).toString()
);

const referenceCount = references.length;
const dimensionCount = 14;

/**
 * Flat Array otimizado
 * O acesso às dimensões de um vetor exige um salto correspondente ao dimensionCount.
 *
 * vectors = [ v0_d0, v0_d1... v0_d13, | v1_d0, v1_d1... v1_d13, | ... ]
 * 
 * labels  = [ 0,                      | 1,                      | ... ] (0: legítimo, 1: fraude)
 */
export const vectors = new Float32Array(referenceCount * dimensionCount);
export const labels = new Int8Array(referenceCount);

references.forEach((reference, index) => {
  for (let dimension = 0; dimension < dimensionCount; dimension++) {
    vectors[index * dimensionCount + dimension] = reference.vector[dimension];
  }
  labels[index] = reference.label === 'fraud' ? 1 : 0;
});