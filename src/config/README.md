# Configurações Globais do Frontend

Esta pasta contém as configurações globais do projeto, como tokens de cores, tipografia, espaçamentos, bordas e sombras. Utilize estes tokens em todos os componentes (atoms, molecules, organisms, etc) para garantir consistência visual.

## Como usar

Importe os tokens desejados:

```ts
import { colors, typography, spacing } from "src/config";
```

## Tokens disponíveis

- `colors`: Paleta de cores do projeto
- `typography`: Fontes, tamanhos e pesos
- `spacing`: Espaçamentos
- `radii`: Bordas arredondadas
- `shadows`: Sombras

> **Importante:** Sempre utilize estes tokens para criar ou estilizar componentes.
