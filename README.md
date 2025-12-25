# 🎄 Christmas Bingo 2025

Um jogo de bingo natalino auto-hospedado para reuniões familiares, construído com Next.js, TypeScript, e SQLite.

## ✨ Características

- **Bingo 5x5 (75 números)** - Formato americano tradicional com espaço FREE no centro
- **Múltiplos modos de jogo**: Linha horizontal, vertical, diagonal, ou cartela cheia
- **Cartelas digitais** - Geradas automaticamente para cada jogador
- **Real-time** - Atualização instantânea via Server-Sent Events (SSE)
- **Reconexão automática** - Jogadores mantêm suas cartelas após refresh/reload
- **Design natalino único** - Evitando "AI slop aesthetic" com Playfair Display + DM Sans
- **Persistência SQLite** - Resiliência a reinicializações do servidor
- **Docker pronto** - Deploy fácil com docker-compose

## 🎮 Como Funciona

### Para Jogadores
1. Acesse `http://seu-servidor:3000`
2. Digite seu nome para entrar
3. Receba uma cartela única gerada automaticamente
4. Toque nos números para marcar conforme são sorteados
5. Grite "BINGO!" quando completar o padrão
6. Coordenador valida seu BINGO

### Para Coordenador
1. Acesse `http://seu-servidor:3000/manager`
2. Entre com a senha (definida em `.env.local`)
3. Selecione o modo de jogo (horizontal, vertical, diagonal, ou cartela cheia)
4. Clique "Iniciar Jogo"
5. Sorteie números clicando em "Sortear Número"
6. Valide BINGO clicando no nome do jogador

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- npm

### Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd bingo

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e defina MANAGER_PASSWORD

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse:
- **Jogadores**: http://localhost:3000
- **Coordenador**: http://localhost:3000/manager

## 🐳 Deploy com Docker

### Opção 1: Docker Compose (Recomendado)

```bash
# Configure variáveis de ambiente
cp .env.example .env
# Edite .env e defina MANAGER_PASSWORD e opcionalmente DOCKER_USERNAME

# Build e inicie
docker-compose up -d

# Veja logs
docker-compose logs -f

# Pare
docker-compose down
```

### Opção 2: Docker Build Manual

```bash
# Build da imagem
docker build -t christmas-bingo .

# Execute
docker run -d \
  -p 3000:3000 \
  -v bingo-data:/app/data \
  -e MANAGER_PASSWORD=suaSenhaSegura \
  --name christmas-bingo \
  christmas-bingo
```

## 📦 Deploy para TrueNAS

### 1. Publique a Imagem no Docker Hub

```bash
# Login no Docker Hub
docker login

# Tag a imagem
docker tag christmas-bingo seu-usuario/christmas-bingo:latest

# Push para Docker Hub
docker push seu-usuario/christmas-bingo:latest
```

### 2. No TrueNAS

```bash
# Baixe docker-compose.yml
wget https://raw.githubusercontent.com/seu-repo/bingo/main/docker-compose.yml

# Edite .env
nano .env
# Defina:
# MANAGER_PASSWORD=suaSenhaSegura
# DOCKER_USERNAME=seu-usuario
# PORT=3000

# Inicie
docker-compose up -d
```

Acesse via `http://truenas-ip:3000`

## 🎨 Customização

### Mudar Senha do Coordenador

Edite `.env` ou `.env.local`:
```bash
MANAGER_PASSWORD=nova_senha_segura
```

Reinicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Docker
docker-compose restart
```

### Cores do Tema

Edite `tailwind.config.js` para mudar a paleta de cores:

```typescript
colors: {
  forest: { DEFAULT: '#0F4C2C', light: '#165B33', dark: '#0A3320' },
  crimson: { DEFAULT: '#A91E23', light: '#C42F35', dark: '#8A171B' },
  gold: { DEFAULT: '#D4AF37', light: '#F8B229', dark: '#B8941F' },
  // ...
}
```

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS com paleta natalina customizada
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: SQLite (better-sqlite3) com persistência em arquivo
- **Real-time**: Server-Sent Events (SSE) para broadcast
- **Deployment**: Docker com multi-stage build

### Estrutura de Diretórios

```
bingo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── manager/           # Manager dashboard
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Player page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── player/            # Player components
│   │   ├── manager/           # Manager components
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── db/                # Database layer
│   │   ├── game/              # Game logic
│   │   ├── sse/               # SSE manager
│   │   ├── hooks/             # React hooks
│   │   └── utils/             # Utilities
│   └── types/                 # TypeScript types
├── data/                       # SQLite database (gitignored)
├── Dockerfile                  # Production Docker image
├── docker-compose.yml          # Docker Compose config
└── package.json
```

## 🎯 Modos de Jogo

1. **Linha Horizontal** - Qualquer linha horizontal completa
2. **Linha Vertical** - Qualquer coluna vertical completa
3. **Diagonal** - Diagonal principal ou secundária
4. **Cartela Cheia** - Todos os 25 números marcados (blackout)

O modo pode ser mudado mid-game pelo coordenador!

## 🔧 Troubleshooting

### Erro: "No active session"
- Coordenador precisa criar e iniciar uma sessão primeiro
- Acesse `/manager` e clique em "Criar Nova Sessão"

### Jogadores não conectando
- Verifique se o servidor está rodando (`npm run dev` ou Docker)
- Confirme que todos estão na mesma rede (se localhost)
- Cheque firewall/portas se usando IP da rede

### SSE não funciona
- Nginx/proxy reverso pode precisar de configuração especial para SSE
- Adicione `proxy_buffering off;` na config do Nginx

### SQLite "database is locked"
- SQLite tem modo WAL habilitado por padrão para melhor concorrência
- Se persistir, reinicie o servidor

### Números sorteados não aparecem
- Verifique conexão SSE (ícone "Reconectando..." não deve aparecer)
- Refresh da página restaura estado

## 📊 Database Schema

### Tables
- `sessions` - Sessões de jogo
- `players` - Jogadores com cartelas
- `drawn_numbers` - Números sorteados
- `player_markings` - Marcações dos jogadores
- `manager_auth` - Hash da senha do coordenador

### Backup

```bash
# Backup do database
cp data/bingo.db data/bingo-backup-$(date +%Y%m%d).db

# Restaurar
cp data/bingo-backup-YYYYMMDD.db data/bingo.db
docker-compose restart
```

## 🎅 Easter Eggs

- Clique nos flocos de neve (opcional)
- Animação especial no espaço FREE
- Efeitos de brilho nos números sorteados

## 🤝 Contribuindo

Este projeto foi criado para uso familiar no Natal. Sinta-se livre para fazer fork e customizar!

## 📝 Licença

ISC

## 🎄 Feliz Natal! 🎅

Desenvolvido com ❤️ para reuniões familiares natalinas.

---

**Tecnologias**: Next.js 14 • TypeScript • SQLite • Server-Sent Events • Docker • Tailwind CSS
