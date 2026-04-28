# Rinha de Backend - Quarta Edição: Detecção de Fraude com Busca Vetorial - JavaScript (Bun)

⚠️ Primeiros Testes

## O desafio

A Rinha de Backend 2026 propõe a construção de uma API de **detecção de fraude em transações de cartão usando busca vetorial**. Para cada transação recebida, a API transforma o payload em um vetor de 14 dimensões, busca no dataset de referência os 5 vetores mais próximos (vizinhos mais próximos) e decide se aprova ou nega com base na proporção de fraudes entre esses vizinhos.

O dataset de referência contém 100.000 vetores pré-rotulados como `fraud` ou `legit`, carregados uma vez no startup da aplicação.

## Principais regras

- Expor `GET /ready` e `POST /fraud-score` na porta `9999`.
- Vetorizar a transação em **14 dimensões** seguindo as fórmulas de normalização definidas pelo desafio.
- Buscar os **5 vizinhos mais próximos** por distância euclidiana no dataset de referência.
- Calcular `fraud_score = número_de_fraudes_entre_os_5 / 5`.
- Responder com `approved = fraud_score < 0.6` e o `fraud_score`.
- A solução deve ter pelo menos **um load balancer e duas instâncias** da API em round-robin.
- Limite de recursos: **1 CPU e 350 MB de memória** somando todos os serviços.
- Deploy via `docker-compose.yml` com imagens públicas compatíveis com `linux-amd64`, rede `bridge`.

## Tecnologias

| Tecnologia | Papel |
|---|---|
| **JavaScript** | Linguagem da aplicação |
| **Bun** | Runtime e servidor HTTP |
| **HAProxy** | Load balancer |

## Como foi implementado

### Armazenamento do dataset em flat array

O dataset de referência (`references.json.gz`) é descomprimido e carregado uma única vez no startup. Os vetores são armazenados em um `Float32Array` contíguo (_flat array_) — em vez de um array de arrays — e os rótulos em um `Int8Array` separado. Isso melhora a localidade de cache durante a varredura linear, reduzindo o overhead de indireção de memória.

### KNN com early exit

O cálculo da distância euclidiana entre a query e cada um dos 100.000 candidatos é feito com uma otimização de **early exit**: as 14 dimensões são calculadas em grupos, e a soma acumulada é comparada com a distância do pior vizinho entre os 5 melhores encontrados até então. Se a soma parcial já ultrapassar esse limiar, o candidato é descartado imediatamente, sem calcular as dimensões restantes.

### Unix Domain Sockets

A comunicação entre o HAProxy e as instâncias da API é feita via **Unix Domain Sockets** em vez de TCP. Sockets Unix evitam o overhead do stack TCP (estabelecimento de conexão, checksum, etc.) para comunicação entre processos no mesmo host, reduzindo latência no caminho crítico das requisições.

### HAProxy

O HAProxy distribui as requisições em round-robin entre duas instâncias (`api-1` e `api-2`), cada uma ouvindo em seu próprio socket Unix (`/tmp/sockets/api-1.sock` e `/tmp/sockets/api-2.sock`). Conexões HTTP são reutilizadas (`http-reuse always`) para eliminar overhead de handshake.
