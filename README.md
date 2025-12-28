# 🎄 Family Bingo 2025: Dual-Mode Edition

Um jogo de bingo natalino premium, agora com suporte a uma arquitetura **Dual-Mode**: Server-Client (SQLite) ou Serverless Peer-to-Peer (WebRTC).

## ✨ O que há de novo (v2.0)

- **Dual-Mode Architecture**: Escolha entre hospedar em um servidor central ou criar uma sala local P2P.
- **Serverless Hosting**: Use o dispositivo do coordenador como "servidor" via WebRTC (PeerJS). Ideal para reuniões sem infraestrutura de servidor.
- **Entrada via QR Code**: Gere um código QR no painel do coordenador para que os jogadores entrem instantaneamente.
- **Design de Alta Fidelidade**: Interface renovada com estética premium, animações suaves e tipografia elegante.
- **Core Unificado**: Lógica de jogo extraída para um `GameEngine` agnóstico de plataforma.

---

## 🎮 Como Funciona

### Para Jogadores
1. Acesse o Lobby em `/` ou escaneie o QR Code do coordenador.
2. Digite seu nome para entrar.
3. Receba uma cartela única gerada automaticamente.
4. Toque nos números para marcar conforme são sorteados.
5. Grite "BINGO!" quando completar o padrão e aguarde a validação.

### Para Coordenadores

> [!IMPORTANT]
> A escolha do modo depende do seu ambiente de deploy:
> - **Modo Serverless (P2P)**: O ideal para deploys em nuvem (Vercel, Cloudflare Pages). Não requer servidor ativo.
> - **Modo Servidor (Local)**: Recomendado apenas para uso em rede privada (Home Lab/Docker). **Não suporta múltiplas sessões simultâneas** (é um design single-session para uso familiar).

1. No Lobby em `/`, escolha o modo de hospedagem adequado ao seu deploy.
3. Clique em **Iniciar Jogo** para abrir a sala.
4. Sorteie números e acompanhe o progresso dos jogadores em tempo real.
5. Valide os bingos clicando no nome do jogador que "bingoou".

---

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- npm

### Instalação e Execução
```bash
# Clone o repositório e instale dependências
git clone <seu-repo>
cd bingo
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e defina MANAGER_PASSWORD

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse:
- **Lobby**: `http://localhost:3000`
- **Painel do Coordenador (Server)**: `/manager`
- **Painel do Coordenador (P2P)**: `/manager?mode=p2p`

---

## 🐳 Deploy com Docker (Server Mode)

### Docker Compose
```bash
cp .env.example .env
# Defina MANAGER_PASSWORD no .env
docker-compose up -d
```

### TrueNAS / Custom Deploy
Para TrueNAS ou outros sistemas, use a imagem Docker gerada:
1. Build: `docker build -t christmas-bingo .`
2. Run: Mapeie a porta `3000` e o volume `/app/data` para persistência do SQLite.

---

## 🔧 Configuração e Variáveis (.env)

- `MANAGER_PASSWORD`: Senha do painel admin (Modo Servidor).
- `DATABASE_PATH`: Caminho do banco SQLite (padrão: `./data/bingo.db`).
- `PORT`: Porta de execução (padrão: `3000`).

---

## 🏗️ Arquitetura

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS.
- **Networking**: PeerJS (WebRTC) para P2P / SSE para Servidor.
- **Storage**: SQLite (Server) / In-Memory (Serverless).
- **Core**: `GameEngine` compartilhado em `src/lib/core`.

---

## 📊 Manutenção e Troubleshoot

- **Backup**: No Modo Servidor, basta copiar o arquivo `data/bingo.db`.
- **"No active session"**: Verifique se o coordenador iniciou o jogo no `/manager`.
- **P2P Isolation**: O novo Modo Serverless requer internet para sinalização inicial, mas o tráfego de jogo é direto entre dispositivos.
- **Reverse Proxy**: Se usar Nginx, certifique-se de configurar `proxy_buffering off;` para o SSE.

---

## 🤝 Contribuição
Desenvolvido com ❤️ para reuniões familiares. Sinta-se livre para customizar!

## 📝 Licença
ISC

---
**Feliz Natal! 🎅**
Next.js • PeerJS • SQLite • WebRTC • Tailwind
