# 💈 Barbearia Machado — MVP de Agendamento Online

MVP de agendamento para a **Barbearia Machado** (São José/SC), atendida por um único barbeiro, o **Pablo**. O cliente agenda em poucos cliques, sem precisar trocar dezenas de mensagens, e o barbeiro controla a agenda por um painel administrativo.

Projeto desenvolvido para o desafio da **DIO** com **Lovable** (desenvolvimento assistido por IA).

🔗 **Demo online:** https://barbearia-machado.lovable.app

🔐 **Área do barbeiro:** https://barbearia-machado.lovable.app/admin

📍 **Endereço:** Rua Mário César da Costa, 2465

📱 **WhatsApp da barbearia:** +55 48 98436-5051

---

## 🎯 Problema

Barbearias pequenas costumam agendar tudo pelo WhatsApp, de forma manual. Isso gera:

- perda de tempo respondendo as mesmas perguntas (preço, horário, disponibilidade);
- conflitos e esquecimentos de horário;
- clientes que desistem por demora na resposta.

## 💡 Solução

Uma página simples onde o cliente vê os serviços, escolhe o dia e o horário disponíveis e confirma o agendamento. O Pablo gerencia tudo em um painel admin. O contato via WhatsApp continua disponível para dúvidas.

---

## ✨ Funcionalidades

**Para o cliente**
- Landing page com apresentação da barbearia, serviços e preços
- Fluxo de agendamento: serviço → data → horário → dados de contato → confirmação
- Apenas horários livres são exibidos (slots de 45 minutos)
- Botão de contato direto via WhatsApp

**Para o barbeiro (painel admin)**
- Visualização dos agendamentos do dia e da semana
- Confirmar, remarcar ou cancelar agendamentos
- Bloquear horários (folgas, imprevistos)
- Gerenciar serviços e preços

---

## 🧾 Serviços e preços

| Serviço | Preço | Duração |
|---|---|---|
| Corte simples | R$ 30 | 45 min |
| Corte desfaçado | R$ 35 | 45 min |
| Corte navalhado | R$ 40 | 45 min |
| Corte com barba | R$ 60 | 45 min |
| Corte com luzes | R$ 135 | 45 min |
| Corte platinado | R$ 145 | 45 min |
| Barba | R$ 30 | 45 min |
| Pezinho | R$ 10 | 45 min |
| Sobrancelha | R$ 10 | 45 min |

## 🕘 Horário de funcionamento

Terça a domingo (fechado às segundas)
- Manhã: 8h às 10h
- Tarde: 15h às 21h

---

## 🛠️ Tecnologias

- **Lovable** — geração e iteração do MVP com IA
- **React 19 + TypeScript** com **TanStack Start / Router** (roteamento e SSR)
- **Tailwind CSS 4** + componentes **Radix UI / shadcn/ui**
- **Supabase** — banco de dados (PostgreSQL) e autenticação do painel admin
- **Drizzle ORM** — schema e migrações
- **Vitest** — testes da lógica de agendamento
- Design e organização: Business Model Canvas (veja a pasta `docs/`)

## 🚀 Como rodar localmente

```bash
# clonar o repositório
git clone https://github.com/CharlesRochaGit/barbearia-machado.git
cd barbearia-machado

# instalar dependências
npm install

# configurar variáveis de ambiente (veja .env.example)
cp .env.example .env

# rodar em modo desenvolvimento
npm run dev
```

O terminal mostra o endereço local (normalmente `http://localhost:5173`).

Para rodar os testes: `npm test`

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (publishable) do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

> Nunca suba chaves secretas (como a `service_role`) para o repositório.

---

## 🗺️ Roadmap (próximos passos)

- [ ] Agente de IA no WhatsApp para responder dúvidas e agendar em nome do Pablo
- [ ] Lembrete automático de horário para o cliente
- [ ] Confirmação do agendamento por WhatsApp
- [ ] Programa de fidelidade (ex.: a cada X cortes, um desconto)
- [ ] Relatório de faturamento no painel admin

---

## 📄 Documentação

- Business Model Canvas:<img width="1521" height="1075" alt="bmc-barbearia-machado" src="https://github.com/user-attachments/assets/c13e0087-93c6-4efd-ac9c-7ef5d0e981d5" />


## 👤 Autor

**Charles Donato Rocha**
Desenvolvedor front-end em formação (ADS — Unicesumar)

- GitHub: [CharlesRochaGit](https://github.com/CharlesRochaGit)
- LinkedIn: [charles-donato-rocha](https://linkedin.com/in/charles-donato-rocha)

---

> Projeto de estudo desenvolvido no desafio da DIO. A Barbearia Machado é um negócio real de um amigo; o MVP é uma demonstração.
