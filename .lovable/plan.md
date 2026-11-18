# Agendamento online — Barbearia Machado (MVP)

Construção seguindo exatamente a especificação enviada, em 3 etapas, cada uma verificada antes da próxima.

## Etapa 1 — Dados e segurança (Lovable Cloud)
- Ativar Lovable Cloud; login por e-mail/senha, cadastro público desativado.
- Tabelas: `shop_settings` (nome, barbeiro, WhatsApp 5548984365051, endereço, horário seg–sáb 09:00–19:00, dias fechados [domingo], intervalo 30 min), `services` (12 serviços iniciais, categoria, duração, preço, ativo), `appointments` (nome, WhatsApp, data/hora início, duração total, valor total, status, lembrete enviado, origem site/whatsapp padrão site), `appointment_services`, `appointment_slots` (um registro por slot de 30 min ocupado, com restrição única para agendamentos ativos), `blocks` (horário ou dia inteiro), `customers` (lead/cliente, visitas, última visita), `user_roles` + `has_role`.
- RLS em tudo: público lê só configuração, serviços ativos e horários ocupados (sem nome/telefone); público cria agendamento apenas via função do back-end; admin lê e altera o resto.
- Gatilho: ao confirmar/concluir, lead vira cliente; cancelar libera os slots.
- Funções no servidor: `getAvailableSlots(data, duração)` e `createAppointment` (validação, fuso America/Sao_Paulo, conflito retorna mensagem amigável).
- Conta admin do Pablo: criada por você no painel do Cloud (sem senha no código); eu atribuo o papel admin.

## Etapa 2 — Página do cliente (/)
- Dark mode (#121212, cards #1E1E1E, âmbar #D97706), fonte Inter, mobile-first, só ícones e gradientes.
- Landing com título, "Atendimento com o Pablo", endereço, horários, tabela de preços, botões "Agendar horário" e WhatsApp.
- Fluxo em passos: serviços (multi-seleção, soma de duração e valor) → data (14 dias, fechados bloqueados) e horário → nome + WhatsApp com máscara → sucesso com resumo e botão "Enviar no WhatsApp da barbearia".

## Etapa 3 — Painel /admin
- Login; Dashboard (agendamentos hoje, faturamento previsto, próximo cliente).
- Agenda dia/semana com status e ações: confirmar, concluir, cancelar, "Lembrar no WhatsApp" (mensagem definida, marca lembrete enviado).
- Bloqueios de horário/dia, Leads e Clientes (histórico, visitas, última visita), Serviços (CRUD, ativar/desativar), Configuração da barbearia.

## Detalhes técnicos
- TanStack Start, `createServerFn` para disponibilidade/criação; rotas admin sob `_authenticated`.
- Testes Vitest para cálculo de slots (duração cobrindo slots, dias fechados, horários passados) e validação de telefone.

## Confirmações
1. Status do agendamento: Pendente, Confirmado, Concluído, Cancelado, Não compareceu.
2. `createAppointment` valida no servidor a tabela `blocks` (horário ou dia inteiro) e recusa com mensagem amigável.
3. `appointments`, `appointment_services` e `customers` sem nenhuma leitura pública. O público lê apenas `shop_settings`, `services` ativos e `appointment_slots` (só data/hora, sem dados pessoais).
4. Testes Vitest de cálculo de slots e validação de telefone mantidos.
