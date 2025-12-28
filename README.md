# 🎄 Family Bingo 2025: Dual-Mode Edition

Um jogo de bingo natalino premium, com suporte a uma arquitetura **Dual-Mode**: Server-Client (SQLite) ou Serverless Peer-to-Peer (WebRTC).

## ✨ Funcionalidades

### Modos de Operação
- **Modo P2P (Serverless)**: O dispositivo do coordenador atua como "servidor" via WebRTC (PeerJS). Ideal para reuniões sem infraestrutura.
- **Modo Servidor**: Backend tradicional com SQLite para persistência. Ideal para home labs e redes privadas.

### Recursos do Jogo
- **Entrada via QR Code**: Gere um código QR no painel do coordenador para entrada instantânea.
- **Reconexão Automática**: Jogadores reconectam automaticamente se a conexão cair.
- **Persistência de Sessão**: No modo P2P, o coordenador pode atualizar a página sem perder a partida.
- **Múltiplos Padrões de Vitória**: Linha horizontal, vertical, diagonal ou cartela cheia.
- **Design Premium**: Interface moderna com animações suaves, glassmorphism e tipografia elegante.

---

## 🎮 Como Funciona

### Para Jogadores
1. Acesse o Lobby em `/` ou escaneie o QR Code do coordenador.
2. Digite seu nome para entrar.
3. Receba uma cartela única gerada automaticamente.
4. Toque nos números para marcar conforme são sorteados.
5. Grite "BINGO!" e aguarde a validação pelo coordenador.

### Para Coordenadores

> [!IMPORTANT]
> A escolha do modo depende do seu ambiente de deploy:
> - **Modo P2P**: Ideal para deploys em nuvem (Vercel, Cloudflare Pages). Não requer servidor ativo.
> - **Modo Servidor**: Recomendado apenas para uso em rede privada (Home Lab/Docker).

1. No Lobby em `/`, escolha o modo de hospedagem.
2. Configure o padrão de vitória desejado.
3. Compartilhe o QR Code ou link com os jogadores.
4. Clique em **Iniciar Jogo** quando todos estiverem prontos.
5. Sorteie números e acompanhe o progresso dos jogadores em tempo real.
6. Valide os bingos clicando no nome do jogador.

---

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- yarn ou npm

### Instalação e Execução
```bash
# Clone o repositório e instale dependências
git clone <seu-repo>
cd family-bingo
yarn install

# Configure para Modo Servidor (opcional)
cp .env.example .env.local
# Edite .env.local se desejar executar no modo servidor

# Inicie o servidor de desenvolvimento (Padrão: Server Mode)
yarn dev

# Ou inicie especificamente em um modo:
yarn dev:p2p
yarn dev:server
```

### Build para Produção

#### Modo P2P (Static - Vercel/Cloudflare)
Gera arquivos estáticos na pasta `out/`.
```bash
yarn build:p2p
# Para testar localmente os arquivos estáticos:
npx serve out
```

#### Modo Servidor (Docker/Node.js)
Gera build otimizado para servidor na pasta `.next/standalone`.
```bash
yarn build:server
yarn start
```

Acesse:
- **Lobby**: `http://localhost:3000`
- **Painel do Coordenador (P2P)**: `/manager?mode=p2p`
- **Painel do Coordenador (Server)**: `/manager`

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 15 • TypeScript • Tailwind CSS                     │
├─────────────────────────────────────────────────────────────┤
│                     Core Layer                               │
│  GameEngine • GameClient/GameHost interfaces                │
├────────────────────────┬────────────────────────────────────┤
│   P2P Mode (WebRTC)    │    Server Mode (HTTP/SSE)          │
│  ┌──────────────────┐  │  ┌──────────────────────────────┐  │
│  │ useP2PGameHost   │  │  │ useHttpGameHost              │  │
│  │ useP2PGameClient │  │  │ useHttpGameClient            │  │
│  │ PeerJS           │  │  │ SSE + REST API               │  │
│  │ LocalStorage     │  │  │ SQLite                       │  │
│  └──────────────────┘  │  └──────────────────────────────┘  │
└────────────────────────┴────────────────────────────────────┘
```

### Componentes Principais

| Componente | Descrição |
|------------|-----------|
| `GameEngine` | Lógica central do jogo (sorteio, validação, registro de jogadores) |
| `useGameHost()` | Hook que escolhe automaticamente entre P2P ou HTTP host |
| `useGameClient()` | Hook que escolhe automaticamente entre P2P ou HTTP client |
| `LocalStorageStorage` | Persistência para modo P2P (sobrevive refresh) |
| `MemoryStorage` | Storage em memória para modo P2P leve |

### Protocolo de Mensagens P2P

| Mensagem | Direção | Descrição |
|----------|---------|-----------|
| `join` | Client → Host | Solicita entrada com nome |
| `welcome` | Host → Client | Confirma entrada com cartela e estado atual |
| `gameStateChanged` | Host → Client | Notifica mudança de status (waiting/active/finished) |
| `numberDrawn` | Host → Client | Notifica número sorteado |
| `gameReset` | Host → Client | Envia nova cartela (novo jogo) |
| `gameEnded` | Host → Client | Notifica fim da partida |
| `ping` | Client → Host | Heartbeat para manter conexão viva |

---

## 🐳 Deploy com Docker (Server Mode)

```bash
cp .env.example .env
# Defina MANAGER_PASSWORD no .env
docker-compose up -d
```

### TrueNAS / Custom Deploy
1. Build: `docker build -t family-bingo .`
2. Run: Mapeie a porta `3000` e o volume `/app/data` para persistência do SQLite.

---

## 🔧 Configuração (.env)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `MANAGER_PASSWORD` | Senha do painel admin (Modo Servidor) | - |
| `DATABASE_PATH` | Caminho do banco SQLite | `./data/bingo.db` |
| `PORT` | Porta de execução | `3000` |

---

## 📊 Notas Técnicas

### Reconexão P2P
- Jogadores são identificados por nome (ID estável), não por conexão WebRTC.
- O coordenador pode atualizar a página; jogadores reconectam em ~3 segundos.
- Estado do jogo persiste no `localStorage` do coordenador.

### Segurança do Link P2P
- O segredo de entrada é passado como fragmento de URL (`#s=xxx`), não enviado ao servidor.
- Apenas jogadores com o segredo correto podem entrar na sala.

### Detecção de Desconexão
- Heartbeat a cada 10 segundos.
- Jogadores são marcados como offline após 25 segundos de silêncio.

---

## 🤝 Contribuição
Desenvolvido com ❤️ para reuniões familiares. Sinta-se livre para customizar!

## 📝 Licença
ISC

---
**Feliz Natal! 🎅**

Next.js • PeerJS • SQLite • WebRTC • Tailwind CSS
