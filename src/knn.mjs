import { vectors, labels } from './startup.mjs';

/**
 * Encontra o índice do vizinho mais distante entre os 5 vizinhos mais próximos.
 * 
 * @example Se os 5 vizinhos mais próximos encontrados até agora tiverem distâncias [0.2, 0.5, 0.3, 0.4, 0.1]  
 * essa função retornará o índice 1, pois a distância 0.5 é a maior entre eles.
 * 
 * @param {Float32Array} neighborDistances - Array contendo as distâncias dos 5 vizinhos mais próximos.
 * @returns {number} Índice do vizinho mais distante
 */
const findFurthestNeighborIndex = (neighborDistances) => {
  let furthestDistance = neighborDistances[0], furthestNeighborIndex = 0;
  for (let neighborIndex = 1; neighborIndex < 5; neighborIndex++) {
    if (neighborDistances[neighborIndex] > furthestDistance) {
      furthestDistance = neighborDistances[neighborIndex];
      furthestNeighborIndex = neighborIndex;
    }
  }
  return furthestNeighborIndex;
};

/**
 * Calcula a Distância Euclidiana Quadrada entre a Query e um Candidato.
 * @param {Float32Array} transactionVector - O vetor que veio na requisição (14 dims).
 * @param {number} candidateStartIndex - A posição inicial (offset) do candidato no array flat.
 * @param {number} currentBestDistance - O limite para o Early Exit (distância do 5º vizinho).
 */
const squaredDistanceWithEarlyExit = (transactionVector, candidateStartIndex, currentBestDistance) => {
  let accumulatedDistance = 0
  let dimension;

  dimension = transactionVector[0] - vectors[candidateStartIndex]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[1] - vectors[candidateStartIndex + 1]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[2] - vectors[candidateStartIndex + 2]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[3] - vectors[candidateStartIndex + 3]; accumulatedDistance += dimension * dimension;

  // Verifica se já ultrapassou a distância do 5º vizinho mais próximo encontrado até agora
  // Se sim, retorna imediatamente para evitar cálculos desnecessários
  // Não faz sentido continuar calculando a distância total se já sabemos que esse candidato não pode ser um dos 5 mais próximos
  if (accumulatedDistance >= currentBestDistance) return accumulatedDistance;

  dimension = transactionVector[4] - vectors[candidateStartIndex + 4]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[5] - vectors[candidateStartIndex + 5]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[6] - vectors[candidateStartIndex + 6]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[7] - vectors[candidateStartIndex + 7]; accumulatedDistance += dimension * dimension;
  if (accumulatedDistance >= currentBestDistance) return accumulatedDistance;

  dimension = transactionVector[8] - vectors[candidateStartIndex + 8]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[9] - vectors[candidateStartIndex + 9]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[10] - vectors[candidateStartIndex + 10]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[11] - vectors[candidateStartIndex + 11]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[12] - vectors[candidateStartIndex + 12]; accumulatedDistance += dimension * dimension;
  dimension = transactionVector[13] - vectors[candidateStartIndex + 13]; accumulatedDistance += dimension * dimension;
  return accumulatedDistance;
};

export const calculateFraudScore = (transactionVector) => {
  // Inicializa os arrays para os 5 vizinhos mais próximos (distâncias e rótulos)
  const topNeighborDistances = new Float32Array(5).fill(Infinity);
  const topNeighborLabels = new Int8Array(5);

  let furthestNeighborSlot = 0;
  let furthestNeighborDistance = Infinity;

  // candidateIndex é usado para acessar label
  // candidateStartIndex é o offset para acessar as 14 dimensões do candidato no array flat
  for (let candidateIndex = 0, candidateStartIndex = 0; candidateStartIndex < vectors.length; candidateIndex++, candidateStartIndex += 14) {
    const candidateDistance = squaredDistanceWithEarlyExit(transactionVector, candidateStartIndex, furthestNeighborDistance);

    // Verifica se o candidato atual é mais próximo do que o vizinho mais distante encontrado até agora
    // Se sim, substitui o vizinho mais distante por esse candidato
    // E atualiza o slot do vizinho mais distante para o próximo candidato a ser comparado
    if (candidateDistance < furthestNeighborDistance) {
      topNeighborDistances[furthestNeighborSlot] = candidateDistance;
      topNeighborLabels[furthestNeighborSlot] = labels[candidateIndex];
      furthestNeighborSlot = findFurthestNeighborIndex(topNeighborDistances);
      furthestNeighborDistance = topNeighborDistances[furthestNeighborSlot];
    }
  }

  // Conta quantos dos 5 vizinhos mais próximos são fraudes (rótulo 1)
  let fraudNeighborCount = 0;
  for (let neighborIndex = 0; neighborIndex < 5; neighborIndex++) {
    fraudNeighborCount += topNeighborLabels[neighborIndex];
  }

  const fraudScore = fraudNeighborCount / 5;
  return `{"approved":${fraudScore < 0.6},"fraud_score":${fraudScore}}`;
};



